import { RARITY_LABELS } from '@/lib/labels';
import type { Rarity } from '@/lib/schema';

/**
 * Shows how rare a compound is **in the diet** — an authored, cited claim on the compound
 * itself, never derived from how many of our items happen to carry it.
 */
export function RarityBadge({ rarity, title }: { rarity: Rarity; title?: string }) {
  const r = RARITY_LABELS[rarity];
  return (
    <span
      title={title ?? r.blurb}
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${r.className}`}
    >
      {r.label}
    </span>
  );
}
