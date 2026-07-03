export const SITE_NAME = 'NutriDex';
export const SITE_TAGLINE = 'Science-backed food benefits';

/** Absolute site URL — from Vercel's env in prod, localhost in dev. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');
