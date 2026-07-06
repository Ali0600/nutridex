import type { Metadata } from 'next';
import { getItems } from '@/lib/content';
import { nutrientPanel } from '@/lib/nutrients';
import { CompareTool, type CompareFood } from '@/components/CompareTool';

export const metadata: Metadata = {
  title: 'Compare foods',
  description: 'Compare foods side by side — benefits and per-100g nutrients from USDA data.',
  alternates: { canonical: '/compare' },
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ items?: string }>;
}) {
  const { items: itemsParam = '' } = await searchParams;
  const initial = itemsParam.split(',').map((s) => s.trim()).filter(Boolean);

  const foods: CompareFood[] = getItems().map((item) => ({
    slug: item.slug,
    name: item.name,
    category: item.category,
    superfood: item.superfood,
    summary: item.summary,
    claims: item.benefits.map((b) => b.claim),
    nutrients: nutrientPanel(item).map(({ def, amount }) => ({
      key: def.key,
      label: def.label,
      unit: def.unit,
      amount,
    })),
  }));

  return (
    <section className="py-6">
      <h1 className="text-3xl font-bold text-neutral-900">Compare foods</h1>
      <p className="mt-2 max-w-2xl text-neutral-600">
        Put two or three foods head to head — their key benefits and per-100g nutrients side by side.
      </p>
      <div className="mt-6">
        <CompareTool foods={foods} initial={initial} />
      </div>
    </section>
  );
}
