import { jsonResponse } from '@/lib/api';
import { getItems } from '@/lib/content';

export const dynamic = 'force-static';

export function GET() {
  return jsonResponse({ items: getItems() });
}
