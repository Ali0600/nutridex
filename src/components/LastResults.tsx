'use client';

import { useMemo, useSyncExternalStore } from 'react';
import Link from 'next/link';
import type { Condition, Item } from '@/lib/schema';
import {
  clearQuizResult,
  getQuizResultSnapshot,
  subscribeQuizResult,
  type SavedQuiz,
} from '@/lib/quiz-storage';
import { ItemCard } from './ItemCard';

/**
 * Shows the visitor's most recent quiz result (persisted in localStorage) so it's findable
 * after the onboarding modal is closed — the Quiz page becomes the durable home for results.
 * Renders nothing until there's a saved result. Server snapshot is `null` so it doesn't flash.
 */
export function LastResults({ items, conditions }: { items: Item[]; conditions: Condition[] }) {
  const raw = useSyncExternalStore(subscribeQuizResult, getQuizResultSnapshot, () => null);

  const saved = useMemo<SavedQuiz | null>(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SavedQuiz;
    } catch {
      return null;
    }
  }, [raw]);

  if (!saved) return null;

  const condMap = new Map(conditions.map((c) => [c.id, c]));
  const itemMap = new Map(items.map((i) => [i.slug, i]));
  const savedConditions = saved.conditionIds
    .map((id) => condMap.get(id))
    .filter((c): c is Condition => Boolean(c));
  const savedItems = saved.itemSlugs.map((s) => itemMap.get(s)).filter((i): i is Item => Boolean(i));

  if (savedConditions.length === 0 && savedItems.length === 0) return null;

  return (
    <section className="mb-10 rounded-2xl border border-leaf-200 bg-leaf-50/60 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-leaf-800">Your last quiz results</h2>
        <button
          type="button"
          onClick={clearQuizResult}
          className="text-sm text-neutral-500 underline hover:text-neutral-700"
        >
          Clear
        </button>
      </div>
      {savedConditions.length > 0 && (
        <p className="mt-1 text-sm text-neutral-600">
          Based on:{' '}
          {savedConditions.map((c, i) => (
            <span key={c.id}>
              <Link href={`/goals/${c.id}`} className="text-leaf-700 underline">
                {c.label}
              </Link>
              {i < savedConditions.length - 1 ? ', ' : ''}
            </span>
          ))}
        </p>
      )}
      {savedItems.length > 0 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {savedItems.map((item) => (
            <ItemCard key={item.slug} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
