import type { Metadata } from 'next';
import Link from 'next/link';
import { getCompounds, getItemsForCompound } from '@/lib/content';
import { RARITY_LABELS } from '@/lib/labels';
import { RARITIES } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Browse by compound',
  description:
    'The bioactive compounds behind the benefits — sulforaphane, oleocanthal, astaxanthin and more — ranked by how rare they are in the diet, and which foods have them.',
  alternates: { canonical: '/compounds' },
};

const foods = (n: number) => `in ${n} food${n === 1 ? '' : 's'} here`;

export default function CompoundsIndexPage() {
  const compounds = getCompounds();

  return (
    <section className="py-6">
      <h1 className="text-3xl font-bold text-neutral-900">Browse by compound</h1>
      <p className="mt-2 max-w-2xl text-neutral-600">
        The actual substances behind the benefits — grouped by how rare they are{' '}
        <em>in the diet as a whole</em>. Some turn up almost nowhere else; others are everywhere.
      </p>
      <p className="mt-3 max-w-2xl rounded-lg bg-neutral-50 p-3 text-sm text-neutral-500">
        Rarity describes the wider food supply, not this database — a compound can be rare in the diet
        yet appear in several foods here, or common in the diet and appear in only one.
      </p>

      {RARITIES.map((rarity) => {
        const group = compounds.filter((c) => c.rarity === rarity);
        if (group.length === 0) return null;
        const meta = RARITY_LABELS[rarity];
        return (
          <div key={rarity} className="mt-8">
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-semibold tracking-wide text-neutral-400 uppercase">
                {meta.label}
              </h2>
              <span className="text-sm text-neutral-400">— {meta.blurb.toLowerCase()}</span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.map((c) => (
                <Link
                  key={c.id}
                  href={`/compounds/${c.id}`}
                  className="group flex flex-col rounded-xl border border-neutral-200 p-4 transition hover:border-leaf-300 hover:bg-leaf-50"
                >
                  <span className="font-semibold text-neutral-900 group-hover:text-leaf-700">
                    {c.name}
                  </span>
                  <span className="mt-1 line-clamp-2 text-sm text-neutral-600">{c.distribution}</span>
                  <span className="mt-2 text-xs text-neutral-400">
                    {c.kind} · {foods(getItemsForCompound(c.id).length)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
