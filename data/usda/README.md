# USDA FoodData Central — nutrient data

Hard per-100g nutrient numbers come from [USDA FoodData Central](https://fdc.nal.usda.gov/)
(public-domain U.S. government data). We use the **bulk CSV downloads**, not the api.data.gov
API, so the pipeline is **keyless** — no API key in anyone's env or in CI.

## Files here

- **`fdc-map.json`** (committed) — maps each item slug to its FDC id and dataset. Hand-curated
  when an item is added; it's the input to the importer.
- **`nutrients.generated.json`** (committed) — the distilled per-100g values the site reads.
  Produced by `npm run usda:import`; never edit by hand.

## Regenerating `nutrients.generated.json`

1. Download the dataset CSV archives from <https://fdc.nal.usda.gov/download-datasets> :
   - **Foundation Foods** — "Foundation Foods" CSV
   - **SR Legacy** — "SR Legacy" CSV
2. Unzip each so these files land in the cache (gitignored — the raw CSVs are hundreds of MB):
   ```
   data/.cache/foundation/{food.csv,food_nutrient.csv,nutrient.csv}
   data/.cache/sr_legacy/{food.csv,food_nutrient.csv,nutrient.csv}
   ```
   (The archives nest the CSVs in a dated subfolder — move the three files up to the dataset dir.)
3. Run:
   ```bash
   npm run usda:import
   ```
4. Review the diff to `nutrients.generated.json` and commit it through the normal PR flow.

The importer only reads the foods listed in `fdc-map.json`, so the big download is a one-time
author-side cost; CI and Vercel never touch USDA.

## Which nutrients

Tracked nutrients (and their USDA `nutrient_nbr`) are defined in
[`src/lib/nutrients-config.ts`](../../src/lib/nutrients-config.ts). Add one there and re-run the
import to add a `/nutrients/<key>` ranking page.
