import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { NUTRIENTS, NUTRIENT_BY_KEY } from '@/lib/nutrients-config';
import { rankByNutrient } from '@/lib/nutrients';
import { NutrientRankTable } from '@/components/NutrientRankTable';

export function generateStaticParams() {
  return NUTRIENTS.map((n) => ({ nutrient: n.key }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ nutrient: string }>;
}): Promise<Metadata> {
  const { nutrient } = await params;
  const def = NUTRIENT_BY_KEY[nutrient];
  if (!def) return {};
  return {
    title: `Which foods have the most ${def.label}?`,
    description: `Foods ranked by ${def.label} per 100g, from USDA FoodData Central.`,
    alternates: { canonical: `/nutrients/${nutrient}` },
  };
}

export default async function NutrientPage({
  params,
}: {
  params: Promise<{ nutrient: string }>;
}) {
  const { nutrient } = await params;
  const def = NUTRIENT_BY_KEY[nutrient];
  if (!def) notFound();
  const rows = rankByNutrient(def.key);

  return (
    <section className="py-6">
      <Link href="/nutrients" className="text-sm text-neutral-500 hover:text-leaf-700">
        ← All nutrients
      </Link>
      <h1 className="mt-3 text-3xl font-bold text-neutral-900">
        Most {def.label} <span className="text-neutral-400">per 100g</span>
      </h1>
      <p className="mt-2 text-neutral-600">
        Foods in the NutriDex database ranked by {def.label} content. Data: USDA FoodData Central.
      </p>
      <div className="mt-6">
        <NutrientRankTable def={def} rows={rows} />
      </div>
      <div className="mt-8">
        <h2 className="text-sm font-semibold tracking-wide text-neutral-400 uppercase">
          Browse by nutrient
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {NUTRIENTS.map((n) => {
            const active = n.key === def.key;
            return active ? (
              <span
                key={n.key}
                aria-current="page"
                className="rounded-full border border-leaf-600 bg-leaf-600 px-3 py-1 text-sm font-medium text-white"
              >
                {n.label}
              </span>
            ) : (
              <Link
                key={n.key}
                href={`/nutrients/${n.key}`}
                className="rounded-full border border-neutral-200 px-3 py-1 text-sm text-neutral-700 hover:border-leaf-300 hover:bg-leaf-50"
              >
                {n.label}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
