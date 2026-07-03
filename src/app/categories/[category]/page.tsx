import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getItemsByCategory } from '@/lib/content';
import { CATEGORIES, categorySchema } from '@/lib/schema';
import { CATEGORY_EMOJI, CATEGORY_LABELS } from '@/lib/labels';
import { ItemCard } from '@/components/ItemCard';

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const parsed = categorySchema.safeParse(category);
  if (!parsed.success) return {};
  const label = CATEGORY_LABELS[parsed.data];
  return {
    title: `${label} — benefits & nutrition`,
    description: `Science-backed benefits of ${label.toLowerCase()} in the NutriDex database.`,
    alternates: { canonical: `/categories/${category}` },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const parsed = categorySchema.safeParse(category);
  if (!parsed.success) notFound();
  const items = getItemsByCategory(parsed.data);

  return (
    <section className="py-6">
      <header className="flex items-center gap-3">
        <span className="text-4xl" aria-hidden>
          {CATEGORY_EMOJI[parsed.data]}
        </span>
        <h1 className="text-3xl font-bold text-neutral-900">{CATEGORY_LABELS[parsed.data]}</h1>
      </header>
      {items.length === 0 ? (
        <p className="mt-6 text-neutral-500">No entries in this category yet — check back soon.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ItemCard key={item.slug} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
