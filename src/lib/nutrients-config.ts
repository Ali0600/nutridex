/**
 * The nutrients NutriDex tracks, keyed by our own stable slug and mapped to the USDA
 * FoodData Central nutrient number (`nutrient_nbr`, stable across datasets). The import
 * script (`scripts/import-usda.ts`) uses `nbr` to pull values out of the CSVs; the site
 * uses `label`/`unit` to render ranking pages and nutrient panels. Adding a nutrient here
 * and re-running the import is all it takes to add a ranking page.
 */
export interface NutrientDef {
  /** Our key, used in `per100g` and in the `/nutrients/[nutrient]` route. */
  key: string;
  label: string;
  unit: 'g' | 'mg' | 'µg';
  /** USDA nutrient_nbr. */
  nbr: number;
  /** Higher-is-better for ranking (all current entries are, but kept explicit). */
  higherIsBetter: boolean;
  /** Tolerable Upper Intake Level for adults (NIH ODS), in this nutrient's `unit`. */
  ul?: number;
  /**
   * What the UL actually applies to. **Read this before adding one.** Most ULs do NOT
   * apply to food:
   * - `total` — the limit counts intake from all sources including food. Only these are
   *   safe to compute a "this much food reaches the limit" portion from.
   * - `supplemental-only` — the limit is for supplements/fortification (magnesium,
   *   vitamin E, B6). Eating the food can't breach it; never compute a portion.
   * - `preformed-only` — vitamin A: the UL is for preformed retinol, but USDA's
   *   `vitamin-a` is RAE, which *merges* retinol with provitamin-A carotenoids. Computing
   *   it would claim sweet potato and kale are near the limit, which is wrong —
   *   beta-carotene does not cause vitamin-A toxicity. Handle liver as an authored caution.
   */
  ulScope?: 'total' | 'supplemental-only' | 'preformed-only';
}

// ULs are the adult (19+) Tolerable Upper Intake Levels from the NIH Office of Dietary
// Supplements. Nutrients with no UL established (protein, fiber, potassium, vitamin K,
// B12) simply omit it.
export const NUTRIENTS: NutrientDef[] = [
  { key: 'protein', label: 'Protein', unit: 'g', nbr: 203, higherIsBetter: true },
  { key: 'fiber', label: 'Fiber', unit: 'g', nbr: 291, higherIsBetter: true },
  { key: 'vitamin-c', label: 'Vitamin C', unit: 'mg', nbr: 401, higherIsBetter: true, ul: 2000, ulScope: 'total' },
  // RAE merges retinol + carotenoids; the UL is retinol-only → never computed. See NutrientDef.
  { key: 'vitamin-a', label: 'Vitamin A (RAE)', unit: 'µg', nbr: 320, higherIsBetter: true, ul: 3000, ulScope: 'preformed-only' },
  { key: 'vitamin-e', label: 'Vitamin E', unit: 'mg', nbr: 323, higherIsBetter: true, ul: 1000, ulScope: 'supplemental-only' },
  { key: 'vitamin-k', label: 'Vitamin K', unit: 'µg', nbr: 430, higherIsBetter: true },
  { key: 'vitamin-d', label: 'Vitamin D', unit: 'µg', nbr: 328, higherIsBetter: true, ul: 100, ulScope: 'total' },
  { key: 'vitamin-b6', label: 'Vitamin B6', unit: 'mg', nbr: 415, higherIsBetter: true, ul: 100, ulScope: 'supplemental-only' },
  { key: 'vitamin-b12', label: 'Vitamin B12', unit: 'µg', nbr: 418, higherIsBetter: true },
  // The folate UL is for folic acid from supplements/fortified food, not food folate.
  { key: 'folate', label: 'Folate (DFE)', unit: 'µg', nbr: 417, higherIsBetter: true, ul: 1000, ulScope: 'supplemental-only' },
  { key: 'calcium', label: 'Calcium', unit: 'mg', nbr: 301, higherIsBetter: true, ul: 2500, ulScope: 'total' },
  { key: 'iron', label: 'Iron', unit: 'mg', nbr: 303, higherIsBetter: true, ul: 45, ulScope: 'total' },
  { key: 'magnesium', label: 'Magnesium', unit: 'mg', nbr: 304, higherIsBetter: true, ul: 350, ulScope: 'supplemental-only' },
  { key: 'potassium', label: 'Potassium', unit: 'mg', nbr: 306, higherIsBetter: true },
  { key: 'zinc', label: 'Zinc', unit: 'mg', nbr: 309, higherIsBetter: true, ul: 40, ulScope: 'total' },
  { key: 'selenium', label: 'Selenium', unit: 'µg', nbr: 317, higherIsBetter: true, ul: 400, ulScope: 'total' },
];

export const NUTRIENT_BY_KEY: Record<string, NutrientDef> = Object.fromEntries(
  NUTRIENTS.map((n) => [n.key, n]),
);
export const NUTRIENT_BY_NBR: Record<number, NutrientDef> = Object.fromEntries(
  NUTRIENTS.map((n) => [n.nbr, n]),
);
