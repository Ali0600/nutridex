import { jsonResponse } from '@/lib/api';
import { getOrgans } from '@/lib/content';

export const dynamic = 'force-static';

export function GET() {
  return jsonResponse({ organs: getOrgans() });
}
