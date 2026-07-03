import { jsonResponse } from '@/lib/api';
import { getConditions } from '@/lib/content';

export const dynamic = 'force-static';

export function GET() {
  return jsonResponse({ conditions: getConditions() });
}
