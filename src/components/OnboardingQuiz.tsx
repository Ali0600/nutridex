'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import type { Condition, Item } from '@/lib/schema';
import { Quiz } from './Quiz';

const SEEN_KEY = 'nutridex.onboarded';
// Wait before offering the quiz, so it doesn't ambush people the instant the page loads —
// they get a moment to see the site first.
const APPEAR_AFTER_MS = 6000;

// Reading localStorage as an external store keeps the server snapshot `false` (so the modal
// never flashes during hydration) while the client decides after mount — no setState-in-effect.
const noopSubscribe = () => () => {};
function getFirstVisitSnapshot(): boolean {
  try {
    return !localStorage.getItem(SEEN_KEY);
  } catch {
    return false; // localStorage unavailable (private mode) — don't auto-open
  }
}

/**
 * First-visit modal wrapper around the quiz. Appears once for new visitors after a short
 * delay, then never again (a localStorage flag). Purely client-side — no accounts, no backend.
 */
export function OnboardingQuiz({ conditions, items }: { conditions: Condition[]; items: Item[] }) {
  const firstVisit = useSyncExternalStore(noopSubscribe, getFirstVisitSnapshot, () => false);
  const [dismissed, setDismissed] = useState(false);
  const [delayElapsed, setDelayElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDelayElapsed(true), APPEAR_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  const open = firstVisit && delayElapsed && !dismissed;

  function close() {
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome quiz"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={close}
          className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-700"
          aria-label="Skip the quiz"
        >
          Skip ✕
        </button>
        <p className="text-sm font-medium tracking-wide text-leaf-600 uppercase">Welcome to NutriDex</p>
        <Quiz conditions={conditions} items={items} onDone={close} persist />
      </div>
    </div>
  );
}
