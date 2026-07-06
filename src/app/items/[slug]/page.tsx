import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getItem, getItems } from '@/lib/content';
import { nutrientPanel } from '@/lib/nutrients';
import { CATEGORY_EMOJI, CATEGORY_LABELS } from '@/lib/labels';
import { SITE_URL } from '@/lib/site';
import { BenefitList } from '@/components/BenefitList';
import { AffiliateSlot } from '@/components/AffiliateSlot';
import { JsonLd } from '@/components/JsonLd';

export function generateStaticParams() {
  return getItems().map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = getItem(slug);
  if (!item) return {};
  const title = `${item.name}: benefits & the science`;
  return {
    title,
    description: item.summary,
    alternates: { canonical: `/items/${item.slug}` },
    openGraph: { title, description: item.summary, type: 'article' },
  };
}

export default async function ItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = getItem(slug);
  if (!item) notFound();

  const panel = nutrientPanel(item);

  return (
    <article className="py-6">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: `${item.name}: benefits and the science`,
          about: item.name,
          url: `${SITE_URL}/items/${item.slug}`,
          dateModified: item.updatedAt,
          citation: item.benefits.flatMap((b) => b.citations.map((c) => c.url)),
        }}
      />

      <nav className="flex items-center justify-between text-sm text-neutral-500">
        <Link href={`/categories/${item.category}`} className="hover:text-leaf-700">
          {CATEGORY_LABELS[item.category]}
        </Link>
        <Link href={`/compare?items=${item.slug}`} className="text-leaf-700 hover:underline">
          Compare →
        </Link>
      </nav>

      <header className="mt-2 flex items-center gap-3">
        <span className="text-4xl" aria-hidden>
          {CATEGORY_EMOJI[item.category]}
        </span>
        <h1 className="text-3xl font-bold text-neutral-900">{item.name}</h1>
        {item.superfood && (
          <span className="rounded-full bg-leaf-100 px-3 py-1 text-sm font-medium text-leaf-800">
            Super Food
          </span>
        )}
      </header>
      <p className="mt-3 max-w-2xl text-lg text-neutral-600">{item.summary}</p>
      {item.superfood && item.superfoodReason && (
        <p className="mt-2 max-w-2xl text-sm text-leaf-700">
          <span className="font-medium">Why it&apos;s a super food: </span>
          {item.superfoodReason}
        </p>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-bold text-neutral-900">Benefits &amp; the science</h2>
        <div className="mt-4">
          <BenefitList benefits={item.benefits} />
        </div>
      </section>

      {item.surprisingFacts.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-neutral-900">Did you know?</h2>
          <ul className="mt-3 space-y-3">
            {item.surprisingFacts.map((f, i) => (
              <li key={i} className="rounded-lg bg-leaf-50 p-4 text-neutral-700">
                {f.text}
                {f.citation && (
                  <a
                    href={f.citation.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="ml-1 text-sm text-leaf-700 underline"
                  >
                    (source)
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {panel.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-neutral-900">Nutrients (per 100g)</h2>
          <p className="mt-1 text-sm text-neutral-500">Source: USDA FoodData Central.</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {panel.map(({ def, amount }) => (
              <Link
                key={def.key}
                href={`/nutrients/${def.key}`}
                className="rounded-lg border border-neutral-200 p-3 hover:border-leaf-300"
              >
                <div className="text-sm text-neutral-500">{def.label}</div>
                <div className="font-semibold text-neutral-800">
                  {amount} {def.unit}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {item.affiliateSlots.length > 0 && (
        <section className="mt-8 space-y-3">
          {item.affiliateSlots.map((slot, i) => (
            <AffiliateSlot key={i} slot={slot} />
          ))}
        </section>
      )}
    </article>
  );
}
