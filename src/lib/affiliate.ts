import type { AffiliateSlot } from './schema';

/**
 * Amazon Associates tag. This is intentionally a committed default, not a secret:
 * the tag is public — it appears in every `?tag=` affiliate URL — so there is nothing
 * to hide. It can still be overridden per-environment via NEXT_PUBLIC_AMAZON_TAG.
 *
 * `nutridex-20` is a US (amazon.com) tag, so links point at amazon.com; localising to
 * other marketplaces (e.g. amazon.de) would need Amazon OneLink or a per-region tag.
 */
export const AFFILIATE_TAG = process.env.NEXT_PUBLIC_AMAZON_TAG ?? 'nutridex-20';

const AMAZON = 'https://www.amazon.com';

/** Search-results link carrying our tag — durable (no ASIN to go out of stock). */
export function amazonSearchUrl(query: string): string {
  return `${AMAZON}/s?k=${encodeURIComponent(query)}&tag=${AFFILIATE_TAG}`;
}

/** Direct product link for a known ASIN (ready for future curated products). */
export function amazonProductUrl(asin: string): string {
  return `${AMAZON}/dp/${encodeURIComponent(asin)}?tag=${AFFILIATE_TAG}`;
}

/**
 * Resolve the outbound URL for an affiliate slot. Prefers a specific product (asin),
 * then an Amazon search, and finally any explicit `url` — so existing raw-url slots
 * keep working unchanged.
 */
export function resolveAffiliateUrl(slot: AffiliateSlot): string {
  if (slot.asin) return amazonProductUrl(slot.asin);
  if (slot.amazonSearch) return amazonSearchUrl(slot.amazonSearch);
  return slot.url ?? '';
}
