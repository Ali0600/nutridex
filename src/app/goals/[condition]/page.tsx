import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCondition, getConditions, getItemsForCondition } from '@/lib/content';
import { SITE_URL } from '@/lib/site';
import { ItemCard } from '@/components/ItemCard';
import { JsonLd } from '@/components/JsonLd';

export function generateStaticParams() {
  return getConditions().map((c) => ({ condition: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ condition: string }>;
}): Promise<Metadata> {
  const { condition } = await params;
  const c = getCondition(condition);
  if (!c) return {};
  return {
    title: `Foods for ${c.label.toLowerCase()}`,
    description: c.intro,
    alternates: { canonical: `/goals/${condition}` },
  };
}

export default async function GoalPage({ params }: { params: Promise<{ condition: string }> }) {
  const { condition } = await params;
  const c = getCondition(condition);
  if (!c) notFound();
  const items = getItemsForCondition(c.id);

  return (
    <section className="py-6">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'MedicalWebPage',
          name: `Foods for ${c.label}`,
          description: c.intro,
          url: `${SITE_URL}/goals/${c.id}`,
        }}
      />
      <Link href="/goals" className="text-sm text-neutral-500 hover:text-leaf-700">
        ← All goals
      </Link>
      <p className="mt-3 text-sm font-medium tracking-wide text-leaf-600 uppercase">{c.kind}</p>
      <h1 className="mt-1 text-3xl font-bold text-neutral-900">{c.label}</h1>
      <p className="mt-2 max-w-2xl text-neutral-600">{c.intro}</p>
      <p className="mt-3 rounded-lg bg-neutral-50 p-3 text-sm text-neutral-500">
        Educational information, not medical advice — see a clinician about any health condition.
      </p>
      {items.length === 0 ? (
        <p className="mt-6 text-neutral-500">No catalogued foods tagged for this goal yet.</p>
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
