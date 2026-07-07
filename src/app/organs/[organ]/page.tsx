import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getItemsForOrgan, getOrgans } from '@/lib/content';
import { ItemCard } from '@/components/ItemCard';

export function generateStaticParams() {
  return getOrgans().map((o) => ({ organ: o.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ organ: string }>;
}): Promise<Metadata> {
  const { organ } = await params;
  const o = getOrgans().find((x) => x.id === organ);
  if (!o) return {};
  return {
    title: `Best foods for ${o.label.toLowerCase()}`,
    description: o.blurb ?? `Foods with benefits for ${o.label.toLowerCase()}.`,
    alternates: { canonical: `/organs/${organ}` },
  };
}

export default async function OrganPage({ params }: { params: Promise<{ organ: string }> }) {
  const { organ } = await params;
  const o = getOrgans().find((x) => x.id === organ);
  if (!o) notFound();
  const items = getItemsForOrgan(o.id);

  return (
    <section className="py-6">
      <Link href="/organs" className="text-sm text-neutral-500 hover:text-leaf-700">
        ← All body parts
      </Link>
      <p className="mt-3 text-sm font-medium tracking-wide text-leaf-600 uppercase">Foods for your</p>
      <h1 className="mt-1 text-3xl font-bold text-neutral-900">{o.label}</h1>
      {o.blurb && <p className="mt-2 max-w-2xl text-neutral-600">{o.blurb}</p>}
      {items.length === 0 ? (
        <p className="mt-6 text-neutral-500">No catalogued foods tagged for this yet.</p>
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
