/**
 * Helpers for the public read-only API (`/api/v1/*`) that the future iOS app consumes.
 * Every handler is statically emitted (`force-static`) and served with permissive CORS so
 * the mobile client — and anyone else — can fetch the dataset without a key.
 */
export const API_VERSION = 'v1';

export function jsonResponse(data: unknown): Response {
  return Response.json(data, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
