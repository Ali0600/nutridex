import type { Metadata } from 'next';
import Link from 'next/link';
import { getSuperfoods } from '@/lib/content';
import { SITE_URL } from '@/lib/site';
import { ItemCard } from '@/components/ItemCard';
import { JsonLd } from '@/components/JsonLd';

export const metadata: Metadata = {
  title: 'Super Fruits',
  description:
    'The standout fruits in NutriDex — the ones with unusually strong, well-studied benefits, and exactly why they earn the label.',
  alternates: { canonical: '/super-fruits' },
};

export default function SuperFruitsPage() {
  const superFruits = getSuperfoods().filter((i) => i.category === 'fruits');

  return (
    <section className="py-6">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'NutriDex Super Fruits',
          url: `${SITE_URL}/super-fruits`,
          itemListElement: superFruits.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${SITE_URL}/items/${item.slug}`,
            name: item.name,
          })),
        }}
      />
      <h1 className="text-3xl font-bold text-neutral-900">Super Fruits 🥝</h1>
      <p className="mt-2 max-w-2xl text-neutral-600">
        The fruits that punch above their weight — exceptional nutrient density or a distinctive,
        well-studied benefit. Each entry explains why. See also all{' '}
        <Link href="/super-foods" className="text-leaf-700 underline">
          Super Foods
        </Link>
        .
      </p>
      {superFruits.length === 0 ? (
        <p className="mt-6 text-neutral-500">No super fruits flagged yet.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {superFruits.map((item) => (
            <ItemCard key={item.slug} item={item} note={item.superfoodReason} />
          ))}
        </div>
      )}
    </section>
  );
}
