import type { Metadata } from 'next';
import { getSuperfoods } from '@/lib/content';
import { SITE_URL } from '@/lib/site';
import { ItemCard } from '@/components/ItemCard';
import { JsonLd } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Super Foods',
  description: 'The standout foods in NutriDex — and the science behind why they earn the label.',
  alternates: { canonical: '/super-foods' },
};

export default function SuperFoodsPage() {
  const superfoods = getSuperfoods();

  return (
    <section className="py-6">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'NutriDex Super Foods',
          url: `${SITE_URL}/super-foods`,
          itemListElement: superfoods.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${SITE_URL}/items/${item.slug}`,
            name: item.name,
          })),
        }}
      />
      <h1 className="text-3xl font-bold text-neutral-900">Super Foods 🌟</h1>
      <p className="mt-2 max-w-2xl text-neutral-600">
        Nutrient-dense standouts with unusually strong or well-studied benefits. Each entry explains
        exactly why it earns the label.
      </p>
      {superfoods.length === 0 ? (
        <p className="mt-6 text-neutral-500">No super foods flagged yet.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {superfoods.map((item) => (
            <ItemCard key={item.slug} item={item} note={item.superfoodReason} />
          ))}
        </div>
      )}
    </section>
  );
}
