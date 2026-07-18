import type { Item } from './schema';
import { NUTRIENT_BY_KEY, type NutrientDef } from './nutrients-config';
import { getNutrientsFile } from './content';

export interface UlPortion {
  def: NutrientDef;
  /** Grams of this food that reach the adult daily upper limit on their own. */
  grams: number;
  per100g: number;
}

/**
 * Portions above which a food alone would meet an adult's Tolerable Upper Intake Level.
 *
 * Deliberately only considers nutrients whose UL applies to **total intake including
 * food** (`ulScope: 'total'`). Supplement-only ULs (magnesium, vitamin E, B6, folic acid)
 * cannot be breached by eating, and vitamin A's UL covers preformed retinol while USDA's
 * value is RAE — computing either would invent a warning that isn't real.
 *
 * A UL is also a whole-day total from *everything* you eat, not a per-food allowance —
 * callers must say so where they render this.
 */
export function ulPortions(item: Item, maxGrams = 500): UlPortion[] {
  const panel = getNutrientsFile()[item.slug]?.per100g;
  if (!panel) return [];

  const rows: UlPortion[] = [];
  for (const [key, per100g] of Object.entries(panel)) {
    const def = NUTRIENT_BY_KEY[key];
    if (!def?.ul || def.ulScope !== 'total' || per100g <= 0) continue;
    const grams = (def.ul / per100g) * 100;
    // Beyond this, "you'd need 5 kg of spinach" is noise rather than a caution.
    if (grams > maxGrams) continue;
    rows.push({ def, grams: Math.round(grams), per100g });
  }
  // Tightest limit first — that's the one worth knowing.
  return rows.sort((a, b) => a.grams - b.grams);
}
