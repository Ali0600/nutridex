import type { Category, Rarity } from './schema';

export const CATEGORY_LABELS: Record<Category, string> = {
  tea: 'Teas',
  fruits: 'Fruits',
  vegetables: 'Vegetables',
  meats: 'Meats',
  nuts: 'Nuts',
  seeds: 'Seeds',
  legumes: 'Legumes',
  grains: 'Grains',
  'herbs-spices': 'Herbs & Spices',
  oils: 'Oils',
};

export const CATEGORY_EMOJI: Record<Category, string> = {
  tea: '🍵',
  fruits: '🥝',
  vegetables: '🥬',
  meats: '🥩',
  nuts: '🥜',
  seeds: '🌱',
  legumes: '🫘',
  grains: '🌾',
  'herbs-spices': '🌿',
  oils: '🫒',
};

/**
 * How rare a compound is in the diet. `blurb` is the plain-English gloss of the tier —
 * these describe the real world, not how many of our items happen to carry it.
 */
export const RARITY_LABELS: Record<Rarity, { label: string; blurb: string; className: string }> = {
  signature: {
    label: 'Signature',
    blurb: 'Essentially unique to this food',
    className: 'bg-leaf-100 text-leaf-800',
  },
  rare: {
    label: 'Rare',
    blurb: 'Only one narrow family of foods',
    className: 'bg-amber-100 text-amber-800',
  },
  uncommon: {
    label: 'Uncommon',
    blurb: 'A handful of foods',
    className: 'bg-sky-100 text-sky-800',
  },
  common: {
    label: 'Common',
    blurb: 'Widespread across the diet',
    className: 'bg-neutral-100 text-neutral-600',
  },
};

export const STRENGTH_LABELS: Record<string, { label: string; className: string }> = {
  strong: { label: 'Strong evidence', className: 'bg-leaf-100 text-leaf-800' },
  moderate: { label: 'Moderate evidence', className: 'bg-amber-100 text-amber-800' },
  preliminary: { label: 'Preliminary', className: 'bg-neutral-100 text-neutral-600' },
};
