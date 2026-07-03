import { jsonResponse } from '@/lib/api';
import { rankByNutrient } from '@/lib/nutrients';
import { NUTRIENTS, NUTRIENT_BY_KEY } from '@/lib/nutrients-config';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return NUTRIENTS.map((n) => ({ nutrient: n.key }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ nutrient: string }> }) {
  const { nutrient } = await params;
  const def = NUTRIENT_BY_KEY[nutrient];
  if (!def) return jsonResponse({ error: 'unknown nutrient', nutrient });
  return jsonResponse({
    nutrient: def,
    ranking: rankByNutrient(def.key).map((r) => ({ slug: r.item.slug, name: r.item.name, amount: r.amount })),
  });
}
