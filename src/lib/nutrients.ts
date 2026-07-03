import { getItems, getNutrientsFile } from './content';
import { NUTRIENT_BY_KEY, type NutrientDef } from './nutrients-config';
import type { Item } from './schema';

export interface NutrientRankRow {
  item: Item;
  amount: number;
}

/**
 * Rank the items we have USDA data for by a nutrient's per-100g amount. Only items with a
 * mapped `fdcId` and a value for this nutrient appear — the ranking is real data or it's
 * absent, never guessed.
 */
export function rankByNutrient(nutrientKey: string, limit = 25): NutrientRankRow[] {
  const def = NUTRIENT_BY_KEY[nutrientKey];
  if (!def) return [];
  const nutrients = getNutrientsFile();
  const rows: NutrientRankRow[] = [];
  for (const item of getItems()) {
    if (!item.fdcId) continue;
    const entry = nutrients[item.slug];
    const amount = entry?.per100g[def.key];
    if (typeof amount === 'number') rows.push({ item, amount });
  }
  rows.sort((a, b) => (def.higherIsBetter ? b.amount - a.amount : a.amount - b.amount));
  return rows.slice(0, limit);
}

/** The per-100g nutrient panel for one item (only nutrients with data). */
export function nutrientPanel(item: Item): { def: NutrientDef; amount: number }[] {
  if (!item.fdcId) return [];
  const entry = getNutrientsFile()[item.slug];
  if (!entry) return [];
  const out: { def: NutrientDef; amount: number }[] = [];
  for (const [key, amount] of Object.entries(entry.per100g)) {
    const def = NUTRIENT_BY_KEY[key];
    if (def && typeof amount === 'number') out.push({ def, amount });
  }
  return out;
}
