import type { Metadata } from 'next';
import { getConditions, getItemsForCondition } from '@/lib/content';
import type { Condition } from '@/lib/schema';
import { LinkTile } from '@/components/LinkTile';

export const metadata: Metadata = {
  title: 'Browse by goal',
  description: 'Pick a health goal, condition, or deficiency and see the foods whose benefits are tagged to it.',
  alternates: { canonical: '/goals' },
};

const foods = (n: number) => `${n} food${n === 1 ? '' : 's'}`;

// Render order + human labels for each `kind` bucket.
const GROUPS: { kind: Condition['kind']; heading: string }[] = [
  { kind: 'goal', heading: 'Goals' },
  { kind: 'condition', heading: 'Health conditions' },
  { kind: 'deficiency', heading: 'Deficiencies' },
];

export default function GoalsIndexPage() {
  const conditions = getConditions();
  return (
    <section className="py-6">
      <h1 className="text-3xl font-bold text-neutral-900">Browse by goal</h1>
      <p className="mt-2 max-w-2xl text-neutral-600">
        Pick a goal, condition, or deficiency to see the foods whose benefits target it. Educational
        information, not medical advice.
      </p>

      {GROUPS.map(({ kind, heading }) => {
        const group = conditions.filter((c) => c.kind === kind);
        if (group.length === 0) return null;
        return (
          <div key={kind} className="mt-8">
            <h2 className="text-sm font-semibold tracking-wide text-neutral-400 uppercase">
              {heading}
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((c) => (
                <LinkTile
                  key={c.id}
                  href={`/goals/${c.id}`}
                  title={c.label}
                  subtitle={foods(getItemsForCondition(c.id).length)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
