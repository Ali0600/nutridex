import type { Category } from './schema';

export const CATEGORY_LABELS: Record<Category, string> = {
  tea: 'Teas',
  fruits: 'Fruits',
  vegetables: 'Vegetables',
  meats: 'Meats',
  nuts: 'Nuts',
  seeds: 'Seeds',
  legumes: 'Legumes',
};

export const CATEGORY_EMOJI: Record<Category, string> = {
  tea: '🍵',
  fruits: '🥝',
  vegetables: '🥬',
  meats: '🥩',
  nuts: '🥜',
  seeds: '🌱',
  legumes: '🫘',
};

export const STRENGTH_LABELS: Record<string, { label: string; className: string }> = {
  strong: { label: 'Strong evidence', className: 'bg-leaf-100 text-leaf-800' },
  moderate: { label: 'Moderate evidence', className: 'bg-amber-100 text-amber-800' },
  preliminary: { label: 'Preliminary', className: 'bg-neutral-100 text-neutral-600' },
};
