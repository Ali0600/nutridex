import type { AffiliateSlot as Slot } from '@/lib/schema';
import { resolveAffiliateUrl } from '@/lib/affiliate';

/**
 * Renders a sponsor/affiliate link with the FTC-required disclosure. Rel is set to
 * `sponsored nofollow` so we stay on the right side of search-engine link policies.
 * The outbound URL is resolved from the slot (asin/amazonSearch/url) so the affiliate
 * tag lives in one place (`@/lib/affiliate`) rather than in every content file.
 */
export function AffiliateSlot({ slot }: { slot: Slot }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <a
        href={resolveAffiliateUrl(slot)}
        target="_blank"
        rel="sponsored nofollow noopener noreferrer"
        className="font-medium text-amber-900 underline underline-offset-2"
      >
        {slot.label} ↗
      </a>
      <p className="mt-1 text-xs text-amber-700">
        {slot.disclosure === 'sponsored' ? 'Sponsored' : 'Affiliate link'}
        {slot.sponsor ? ` · ${slot.sponsor}` : ''} — NutriDex may earn a commission. This does
        not affect the science above.
      </p>
    </div>
  );
}
