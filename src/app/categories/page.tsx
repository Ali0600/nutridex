import type { Metadata } from 'next';
import { getItemsByCategory } from '@/lib/content';
import { CATEGORIES } from '@/lib/schema';
import { CATEGORY_EMOJI, CATEGORY_LABELS } from '@/lib/labels';
import { LinkTile } from '@/components/LinkTile';

export const metadata: Metadata = {
  title: 'Browse by category',
  description: 'Every food group in NutriDex — teas, fruits, vegetables, meats, nuts, seeds, legumes, grains, spices, and oils.',
  alternates: { canonical: '/categories' },
};

const foods = (n: number) => `${n} food${n === 1 ? '' : 's'}`;

export default function CategoriesIndexPage() {
  return (
    <section className="py-6">
      <h1 className="text-3xl font-bold text-neutral-900">Browse by category</h1>
      <p className="mt-2 max-w-2xl text-neutral-600">
        Every food group in the database. Pick one to see its foods and the science behind them.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => (
          <LinkTile
            key={c}
            href={`/categories/${c}`}
            emoji={CATEGORY_EMOJI[c]}
            title={CATEGORY_LABELS[c]}
            subtitle={foods(getItemsByCategory(c).length)}
          />
        ))}
      </div>
    </section>
  );
}
