import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCompound, getCompounds, getItemsForCompound } from '@/lib/content';
import { RARITY_LABELS } from '@/lib/labels';
import { ItemCard } from '@/components/ItemCard';
import { RarityBadge } from '@/components/RarityBadge';

export function generateStaticParams() {
  return getCompounds().map((c) => ({ compound: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ compound: string }>;
}): Promise<Metadata> {
  const { compound } = await params;
  const c = getCompound(compound);
  if (!c) return {};
  return {
    title: `${c.name}: which foods have it?`,
    description: `${c.blurb} ${c.distribution}`,
    alternates: { canonical: `/compounds/${c.id}` },
  };
}

export default async function CompoundPage({
  params,
}: {
  params: Promise<{ compound: string }>;
}) {
  const { compound } = await params;
  const c = getCompound(compound);
  if (!c) notFound();
  const items = getItemsForCompound(c.id);

  return (
    <section className="py-6">
      <Link href="/compounds" className="text-sm text-neutral-500 hover:text-leaf-700">
        ← All compounds
      </Link>

      <header className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold text-neutral-900">{c.name}</h1>
        <RarityBadge rarity={c.rarity} />
        <span className="text-sm text-neutral-400">{c.kind}</span>
      </header>

      <p className="mt-3 max-w-2xl text-lg text-neutral-600">{c.blurb}</p>

      <section className="mt-6 max-w-2xl rounded-lg border border-neutral-200 p-4">
        <h2 className="text-sm font-semibold tracking-wide text-neutral-400 uppercase">
          How rare is it?
        </h2>
        <p className="mt-2 text-neutral-700">
          <span className="font-medium">{RARITY_LABELS[c.rarity].blurb}.</span> {c.distribution}
        </p>
        <ul className="mt-3 space-y-1">
          {c.citations.map((cit) => (
            <li key={cit.url} className="text-sm">
              <a
                href={cit.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-leaf-700 underline underline-offset-2"
              >
                {cit.title}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-neutral-900">
          Foods here that contain it{' '}
          <span className="text-base font-normal text-neutral-400">({items.length})</span>
        </h2>
        {items.length === 0 ? (
          <p className="mt-3 text-neutral-500">No catalogued foods are tagged with this yet.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ItemCard key={item.slug} item={item} />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
