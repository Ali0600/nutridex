'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Condition, Item } from '@/lib/schema';
import { recommendItems, scoreConditions, type QuizAnswers } from '@/lib/quiz';
import { ItemCard } from './ItemCard';

type Step = 'problems' | 'questions' | 'results';

/**
 * The data-driven symptom quiz. Runs entirely client-side: pick the problems you're
 * dealing with, answer their symptom questions, and get foods whose benefits are tagged
 * to those conditions. `onDone` lets the onboarding modal close itself on finish.
 */
export function Quiz({
  conditions,
  items,
  onDone,
}: {
  conditions: Condition[];
  items: Item[];
  onDone?: () => void;
}) {
  const quizConditions = useMemo(() => conditions.filter((c) => c.quiz), [conditions]);
  const [step, setStep] = useState<Step>('problems');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [answers, setAnswers] = useState<QuizAnswers>({});

  const chosenConditions = quizConditions.filter((c) => selected.has(c.id));

  const results = useMemo(() => {
    if (step !== 'results') return null;
    const scores = scoreConditions(chosenConditions, answers);
    return { scores, recs: recommendItems(scores, items) };
  }, [step, chosenConditions, answers, items]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function reset() {
    setStep('problems');
    setSelected(new Set());
    setAnswers({});
  }

  return (
    <div className="space-y-6">
      {step === 'problems' && (
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">What are you dealing with?</h2>
          <p className="mt-1 text-sm text-neutral-500">Pick any that apply — we&apos;ll match foods to them.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {quizConditions.map((c) => (
              <label
                key={c.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${
                  selected.has(c.id)
                    ? 'border-leaf-400 bg-leaf-50 text-leaf-800'
                    : 'border-neutral-200 hover:border-leaf-200'
                }`}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-leaf-600"
                  checked={selected.has(c.id)}
                  onChange={() => toggle(c.id)}
                />
                {c.quiz!.triggerLabel}
              </label>
            ))}
          </div>
          <button
            type="button"
            disabled={selected.size === 0}
            onClick={() => setStep(chosenConditions.some((c) => c.quiz!.questions.length) ? 'questions' : 'results')}
            className="mt-5 rounded-lg bg-leaf-600 px-4 py-2 font-medium text-white disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      )}

      {step === 'questions' && (
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">A few quick questions</h2>
          <div className="mt-4 space-y-5">
            {chosenConditions.flatMap((c) =>
              c.quiz!.questions.map((q) => (
                <fieldset key={q.id}>
                  <legend className="font-medium text-neutral-800">{q.text}</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {q.answers.map((a, ai) => (
                      <label
                        key={ai}
                        className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm ${
                          answers[q.id] === a.weight
                            ? 'border-leaf-400 bg-leaf-50 text-leaf-800'
                            : 'border-neutral-200 hover:border-leaf-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          className="sr-only"
                          checked={answers[q.id] === a.weight}
                          onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: a.weight }))}
                        />
                        {a.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )),
            )}
          </div>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => setStep('problems')}
              className="rounded-lg border border-neutral-300 px-4 py-2 font-medium text-neutral-700"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep('results')}
              className="rounded-lg bg-leaf-600 px-4 py-2 font-medium text-white"
            >
              See my foods
            </button>
          </div>
        </div>
      )}

      {step === 'results' && results && (
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Foods worth a look</h2>
          {results.scores.length === 0 ? (
            <p className="mt-2 text-neutral-600">
              Your answers didn&apos;t strongly flag any of the goals. Browse the{' '}
              <Link href="/super-foods" className="text-leaf-700 underline">
                Super Foods
              </Link>{' '}
              to start.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-neutral-500">
                Based on:{' '}
                {results.scores.map((s, i) => (
                  <span key={s.condition.id}>
                    <Link href={`/goals/${s.condition.id}`} className="text-leaf-700 underline">
                      {s.condition.label}
                    </Link>
                    {i < results.scores.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </p>
              {results.recs.length > 0 ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {results.recs.map((r) => (
                    <ItemCard
                      key={r.item.slug}
                      item={r.item}
                      note={`Matches ${r.matchedConditions.length} of your goals`}
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-neutral-600">
                  No catalogued foods are tagged to those goals yet — the database is still growing.
                </p>
              )}
            </>
          )}
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-neutral-300 px-4 py-2 font-medium text-neutral-700"
            >
              Start over
            </button>
            {onDone && (
              <button
                type="button"
                onClick={onDone}
                className="rounded-lg bg-leaf-600 px-4 py-2 font-medium text-white"
              >
                Done
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
