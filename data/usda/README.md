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

## Alternative: the API (a free key, no CSV download)

If you'd rather not download the bulk CSVs, use the FoodData Central **API** instead:

1. Get a free key at <https://fdc.nal.usda.gov/api-key-signup>.
2. Put it in `.env.local` at the repo root (gitignored — never commit it):
   ```
   FDC_API_KEY=your_key_here
   ```
3. Run:
   ```bash
   npm run usda:enrich            # every catalogued food
   npm run usda:enrich -- almond  # or specific slugs
   ```

It looks up each food's best FDC match, writes both `nutrients.generated.json` and `fdc-map.json`,
and prints the matched descriptions so you can catch a bad match. Review, then commit via PR. The
key is author-side only — the app and CI never read it.

## Which nutrients

Tracked nutrients (and their USDA `nutrient_nbr`) are defined in
[`src/lib/nutrients-config.ts`](../../src/lib/nutrients-config.ts). Add one there and re-run the
import to add a `/nutrients/<key>` ranking page.
