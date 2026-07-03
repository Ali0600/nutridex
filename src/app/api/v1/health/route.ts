import { API_VERSION, jsonResponse } from '@/lib/api';

export const dynamic = 'force-static';

export function GET() {
  return jsonResponse({ ok: true, api: API_VERSION });
}
