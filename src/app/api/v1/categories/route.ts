import { jsonResponse } from '@/lib/api';
import { getItemsByCategory } from '@/lib/content';
import { CATEGORIES } from '@/lib/schema';
import { CATEGORY_LABELS } from '@/lib/labels';

export const dynamic = 'force-static';

export function GET() {
  return jsonResponse({
    categories: CATEGORIES.map((id) => ({
      id,
      label: CATEGORY_LABELS[id],
      count: getItemsByCategory(id).length,
    })),
  });
}
