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
}

export const NUTRIENTS: NutrientDef[] = [
  { key: 'protein', label: 'Protein', unit: 'g', nbr: 203, higherIsBetter: true },
  { key: 'fiber', label: 'Fiber', unit: 'g', nbr: 291, higherIsBetter: true },
  { key: 'vitamin-c', label: 'Vitamin C', unit: 'mg', nbr: 401, higherIsBetter: true },
  { key: 'vitamin-a', label: 'Vitamin A (RAE)', unit: 'µg', nbr: 320, higherIsBetter: true },
  { key: 'vitamin-e', label: 'Vitamin E', unit: 'mg', nbr: 323, higherIsBetter: true },
  { key: 'vitamin-k', label: 'Vitamin K', unit: 'µg', nbr: 430, higherIsBetter: true },
  { key: 'vitamin-d', label: 'Vitamin D', unit: 'µg', nbr: 328, higherIsBetter: true },
  { key: 'vitamin-b6', label: 'Vitamin B6', unit: 'mg', nbr: 415, higherIsBetter: true },
  { key: 'vitamin-b12', label: 'Vitamin B12', unit: 'µg', nbr: 418, higherIsBetter: true },
  { key: 'folate', label: 'Folate (DFE)', unit: 'µg', nbr: 417, higherIsBetter: true },
  { key: 'calcium', label: 'Calcium', unit: 'mg', nbr: 301, higherIsBetter: true },
  { key: 'iron', label: 'Iron', unit: 'mg', nbr: 303, higherIsBetter: true },
  { key: 'magnesium', label: 'Magnesium', unit: 'mg', nbr: 304, higherIsBetter: true },
  { key: 'potassium', label: 'Potassium', unit: 'mg', nbr: 306, higherIsBetter: true },
  { key: 'zinc', label: 'Zinc', unit: 'mg', nbr: 309, higherIsBetter: true },
  { key: 'selenium', label: 'Selenium', unit: 'µg', nbr: 317, higherIsBetter: true },
];

export const NUTRIENT_BY_KEY: Record<string, NutrientDef> = Object.fromEntries(
  NUTRIENTS.map((n) => [n.key, n]),
);
export const NUTRIENT_BY_NBR: Record<number, NutrientDef> = Object.fromEntries(
  NUTRIENTS.map((n) => [n.nbr, n]),
);
