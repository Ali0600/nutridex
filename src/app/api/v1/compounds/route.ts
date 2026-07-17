import { jsonResponse } from '@/lib/api';
import { getCompounds, getItemsForCompound } from '@/lib/content';

export const dynamic = 'force-static';

export function GET() {
  return jsonResponse({
    compounds: getCompounds().map((c) => ({
      ...c,
      // Which of OUR foods carry it — a fact about this database, not a rarity signal.
      itemSlugs: getItemsForCompound(c.id).map((i) => i.slug),
    })),
  });
}
