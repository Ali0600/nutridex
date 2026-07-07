import type { Metadata } from 'next';
import { getItemsForOrgan, getOrgans } from '@/lib/content';
import { LinkTile } from '@/components/LinkTile';

export const metadata: Metadata = {
  title: 'Browse by body part',
  description: 'Find foods with benefits for a specific part of the body — heart, brain, gut, skin, eyes, bones, and more.',
  alternates: { canonical: '/organs' },
};

const foods = (n: number) => `${n} food${n === 1 ? '' : 's'}`;

export default function OrgansIndexPage() {
  const organs = getOrgans();
  return (
    <section className="py-6">
      <h1 className="text-3xl font-bold text-neutral-900">Browse by body part</h1>
      <p className="mt-2 max-w-2xl text-neutral-600">
        Which foods have benefits for which part of you. Pick an organ or system to see the foods
        tagged to it.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {organs.map((o) => (
          <LinkTile
            key={o.id}
            href={`/organs/${o.id}`}
            title={o.label}
            subtitle={foods(getItemsForOrgan(o.id).length)}
          />
        ))}
      </div>
    </section>
  );
}
