import { API_VERSION, jsonResponse } from '@/lib/api';
import { getConditions, getItems, getNutrientsFile, getOrgans } from '@/lib/content';

export const dynamic = 'force-static';

/** The whole corpus in one payload — for offline-capable app sync. */
export function GET() {
  return jsonResponse({
    version: API_VERSION,
    generatedAt: new Date().toISOString(),
    items: getItems(),
    organs: getOrgans(),
    conditions: getConditions(),
    nutrients: getNutrientsFile(),
  });
}
