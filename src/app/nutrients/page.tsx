import type { Metadata } from 'next';
import { rankByNutrient } from '@/lib/nutrients';
import { NUTRIENTS } from '@/lib/nutrients-config';
import { LinkTile } from '@/components/LinkTile';

export const metadata: Metadata = {
  title: 'Browse by nutrient',
  description: 'Which foods give you the most of each nutrient — protein, fiber, iron, calcium, and the vitamins — ranked from USDA data.',
  alternates: { canonical: '/nutrients' },
};

export default function NutrientsIndexPage() {
  return (
    <section className="py-6">
      <h1 className="text-3xl font-bold text-neutral-900">Browse by nutrient</h1>
      <p className="mt-2 max-w-2xl text-neutral-600">
        Which foods actually give you the most of each nutrient — ranked from USDA FoodData Central,
        not vibes.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {NUTRIENTS.map((n) => {
          const top = rankByNutrient(n.key, 1)[0]?.item.name;
          return (
            <LinkTile
              key={n.key}
              href={`/nutrients/${n.key}`}
              title={n.label}
              subtitle={top ? `Top: ${top}` : `Ranked in ${n.unit}`}
            />
          );
        })}
      </div>
    </section>
  );
}
