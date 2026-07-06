import type { Metadata } from 'next';
import { getItems } from '@/lib/content';
import { searchItems } from '@/lib/search';
import { ItemCard } from '@/components/ItemCard';
import { ItemSearchBox } from '@/components/ItemSearchBox';

export const metadata: Metadata = {
  title: 'Search foods',
  description: 'Search every food in NutriDex by name, benefit, condition, or nutrient.',
  alternates: { canonical: '/items' },
};

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = '' } = await searchParams;
  const query = q.trim();
  const items = getItems();
  const results = searchItems(items, query);

  return (
    <section className="py-6">
      <h1 className="text-3xl font-bold text-neutral-900">
        {query ? `Search: “${query}”` : 'All foods'}
      </h1>
      <p className="mt-2 text-neutral-600">
        {query
          ? `${results.length} match${results.length === 1 ? '' : 'es'}`
          : `Browse all ${items.length} foods, or search by name, benefit, condition, or nutrient.`}
      </p>

      <div className="mt-4">
        <ItemSearchBox defaultValue={query} autoFocus />
      </div>

      {results.length === 0 ? (
        <p className="mt-10 text-neutral-500">
          No foods match “{query}”. Try a benefit (“blood pressure”), a nutrient (“iron”), or a food
          name.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((item) => (
            <ItemCard key={item.slug} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
