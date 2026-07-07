import Link from 'next/link';
import { getConditions, getItems, getSuperfoods } from '@/lib/content';
import { CATEGORIES } from '@/lib/schema';
import { CATEGORY_EMOJI, CATEGORY_LABELS } from '@/lib/labels';
import { SITE_URL } from '@/lib/site';
import { ItemCard } from '@/components/ItemCard';
import { LinkTile } from '@/components/LinkTile';
import { OnboardingQuiz } from '@/components/OnboardingQuiz';
import { JsonLd } from '@/components/JsonLd';

export default function HomePage() {
  const items = getItems();
  const conditions = getConditions();
  const superfoods = getSuperfoods().slice(0, 6);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'NutriDex',
          url: SITE_URL,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${SITE_URL}/items?q={query}`,
            'query-input': 'required name=query',
          },
        }}
      />
      <OnboardingQuiz conditions={conditions} items={items} />

      <section className="py-10 text-center sm:py-16">
        <h1 className="text-4xl font-bold tracking-tight text-leaf-800 sm:text-5xl">
          Every food, explained.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
          The science-backed benefits of teas, fruits, vegetables, meats, and nuts — with the
          mechanism behind each claim and the studies to prove it.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/quiz" className="rounded-lg bg-leaf-600 px-5 py-2.5 font-medium text-white hover:bg-leaf-700">
            Take the symptom quiz
          </Link>
          <Link
            href="/super-foods"
            className="rounded-lg border border-leaf-300 px-5 py-2.5 font-medium text-leaf-700 hover:bg-leaf-50"
          >
            Browse Super Foods
          </Link>
        </div>
      </section>

      <section className="py-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold tracking-wide text-neutral-400 uppercase">Browse by category</h2>
          <Link href="/categories" className="text-sm font-medium text-leaf-700 hover:underline">
            See all →
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/categories/${c}`}
              className="flex flex-col items-center gap-1 rounded-xl border border-neutral-200 py-5 hover:border-leaf-300 hover:bg-leaf-50"
            >
              <span className="text-3xl" aria-hidden>
                {CATEGORY_EMOJI[c]}
              </span>
              <span className="text-sm font-medium text-neutral-700">{CATEGORY_LABELS[c]}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-6">
        <h2 className="text-sm font-semibold tracking-wide text-neutral-400 uppercase">Explore the database</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <LinkTile href="/items" emoji="🍽️" title="All foods" subtitle={`${items.length} foods, searchable`} />
          <LinkTile href="/organs" emoji="🫀" title="By body part" subtitle="Heart, brain, gut, skin…" />
          <LinkTile href="/goals" emoji="🎯" title="By goal" subtitle="Conditions, goals, deficiencies" />
          <LinkTile href="/nutrients" emoji="🧪" title="By nutrient" subtitle="Vitamin & mineral rankings" />
        </div>
      </section>

      {superfoods.length > 0 && (
        <section className="py-10">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-bold text-neutral-900">Super Foods</h2>
            <Link href="/super-foods" className="text-sm font-medium text-leaf-700 hover:underline">
              See all →
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {superfoods.map((item) => (
              <ItemCard key={item.slug} item={item} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
