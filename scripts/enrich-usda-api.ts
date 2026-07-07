/**
 * Enrich nutrient panels via the USDA FoodData Central **API** (needs a free key) — the
 * alternative to the keyless CSV importer (scripts/import-usda.ts) for when you don't want to
 * download the multi-hundred-MB bulk CSVs. For each catalogued food it looks up the best
 * FoodData Central match, pulls the per-100g values for our tracked nutrients, and writes both
 * `data/usda/nutrients.generated.json` and `data/usda/fdc-map.json`.
 *
 * Author-side only — never runs in CI/build (which stay keyless; nutrient data is committed).
 *
 * Setup:  put FDC_API_KEY in .env.local (see .env.example) — get a key at
 *         https://fdc.nal.usda.gov/api-key-signup
 * Run:    npm run usda:enrich            # all foods below
 *         npm run usda:enrich -- almond  # just some slugs
 *
 * Always eyeball the printed slug → matched-description table; USDA search can mis-hit (e.g.
 * "Orange peel" for "orange"). The curated queries below aim to avoid that.
 */
import fs from 'node:fs';
import path from 'node:path';
import { NUTRIENT_BY_NBR } from '../src/lib/nutrients-config';
import { fdcMapFileSchema, nutrientsFileSchema, type NutrientsFile } from '../src/lib/schema';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'data', 'usda', 'nutrients.generated.json');
const MAP = path.join(ROOT, 'data', 'usda', 'fdc-map.json');
const API = 'https://api.nal.usda.gov/fdc/v1';

// Curated search queries per food slug (SR Legacy descriptions), chosen to avoid mis-hits.
// Slugs with no clean whole-food match (matcha, peppermint-tea) are intentionally omitted.
const FOOD_QUERIES: Record<string, string> = {
  beetroot: 'Beets, raw',
  'green-tea': 'Beverages, tea, green, brewed, regular',
  ginger: 'Ginger root, raw',
  kiwi: 'Kiwifruit, green, raw',
  blueberry: 'Blueberries, raw',
  pomegranate: 'Pomegranates, raw',
  avocado: 'Avocados, raw, all commercial varieties',
  banana: 'Bananas, raw',
  orange: 'Oranges, raw, all commercial varieties',
  spinach: 'Spinach, raw',
  broccoli: 'Broccoli, raw',
  garlic: 'Garlic, raw',
  kale: 'Kale, raw',
  'sweet-potato': 'Sweet potato, raw, unprepared',
  salmon: 'Fish, salmon, Atlantic, wild, raw',
  'beef-liver': 'Beef, variety meats and by-products, liver, raw',
  sardine: 'Fish, sardine, Atlantic, canned in oil, drained solids with bone',
  'chicken-breast': 'Chicken, broilers or fryers, breast, meat only, raw',
  walnut: 'Nuts, walnuts, english',
  almond: 'Nuts, almonds',
  'brazil-nut': 'Nuts, brazilnuts, dried, unblanched',
  pistachio: 'Nuts, pistachio nuts, raw',
  flaxseed: 'Seeds, flaxseed',
  'chia-seed': 'Seeds, chia seeds, dried',
  'sesame-seed': 'Seeds, sesame seeds, whole, dried',
  'pumpkin-seed': 'Seeds, pumpkin and squash seed kernels, dried',
  'sunflower-seed': 'Seeds, sunflower seed kernels, dried',
};

// A few foods that keyword search mis-ranks (e.g. "Sweet Potato puffs" outranks the raw root,
// and generic chicken outranks the breast). Pin these to the correct SR Legacy fdcId.
const FOOD_FDC_OVERRIDE: Record<string, number> = {
  'sweet-potato': 168482, // Sweet potato, raw, unprepared
  'chicken-breast': 171077, // Chicken, broilers or fryers, breast, meat only, raw
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Load FDC_API_KEY from the environment, falling back to a minimal .env.local parse. */
function apiKey(): string {
  if (process.env.FDC_API_KEY) return process.env.FDC_API_KEY;
  const envFile = path.join(ROOT, '.env.local');
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
      const m = line.match(/^\s*FDC_API_KEY\s*=\s*(.+?)\s*$/);
      if (m) return m[1].replace(/^["']|["']$/g, '');
    }
  }
  console.error(
    'Missing FDC_API_KEY. Add it to .env.local (see .env.example) — free key at\n' +
      'https://fdc.nal.usda.gov/api-key-signup',
  );
  process.exit(1);
}

type Dataset = 'sr_legacy' | 'foundation' | 'survey_fndds';

function normalizeDataset(dataType?: string): Dataset {
  const t = (dataType ?? '').toLowerCase();
  if (t.includes('foundation')) return 'foundation';
  if (t.includes('survey') || t.includes('fndds')) return 'survey_fndds';
  return 'sr_legacy';
}

async function searchFdcId(
  key: string,
  query: string,
): Promise<{ fdcId: number; description: string; dataset: Dataset } | null> {
  // Prefer SR Legacy — it carries the fullest per-100g nutrient profiles for whole foods;
  // Foundation entries are often sparse (a handful of nutrients) or oddly-matched products.
  for (const dataType of ['SR Legacy', 'Foundation']) {
    const url = `${API}/foods/search?api_key=${key}&pageSize=1&dataType=${encodeURIComponent(dataType)}&query=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`search ${res.status}`);
    const data = (await res.json()) as { foods?: { fdcId: number; description: string; dataType?: string }[] };
    const f = data.foods?.[0];
    if (f) return { fdcId: f.fdcId, description: f.description, dataset: normalizeDataset(f.dataType) };
  }
  return null;
}

async function fetchNutrients(key: string, fdcId: number): Promise<{ description: string; per100g: Record<string, number> }> {
  const res = await fetch(`${API}/food/${fdcId}?api_key=${key}`);
  if (!res.ok) throw new Error(`food ${res.status}`);
  const d = (await res.json()) as {
    description?: string;
    foodNutrients?: { nutrient?: { number?: string }; amount?: number }[];
  };
  const per100g: Record<string, number> = {};
  for (const fn of d.foodNutrients ?? []) {
    const nbr = Number(fn.nutrient?.number);
    const def = NUTRIENT_BY_NBR[nbr];
    if (def && typeof fn.amount === 'number') per100g[def.key] = Math.round(fn.amount * 1000) / 1000;
  }
  return { description: d.description ?? String(fdcId), per100g };
}

async function main(): Promise<void> {
  const key = apiKey();
  const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const slugs = (only.length ? only : Object.keys(FOOD_QUERIES)).filter((s) => FOOD_QUERIES[s]);

  const nutrients: NutrientsFile = fs.existsSync(OUT)
    ? nutrientsFileSchema.parse(JSON.parse(fs.readFileSync(OUT, 'utf8')))
    : {};
  const fdcMap: Record<string, { fdcId: number; dataset: Dataset }> = fs.existsSync(MAP)
    ? fdcMapFileSchema.parse(JSON.parse(fs.readFileSync(MAP, 'utf8')))
    : {};

  let ok = 0;
  for (const slug of slugs) {
    try {
      const override = FOOD_FDC_OVERRIDE[slug];
      const hit = override
        ? { fdcId: override, description: '(pinned)', dataset: 'sr_legacy' as Dataset }
        : await searchFdcId(key, FOOD_QUERIES[slug]);
      if (!hit) {
        console.warn(`⚠️  ${slug}: no FDC match for "${FOOD_QUERIES[slug]}"`);
        continue;
      }
      await sleep(200);
      const { description, per100g } = await fetchNutrients(key, hit.fdcId);
      nutrients[slug] = { fdcId: hit.fdcId, description, dataset: hit.dataset, per100g };
      fdcMap[slug] = { fdcId: hit.fdcId, dataset: hit.dataset };
      ok++;
      console.log(`✓ ${slug.padEnd(15)} → ${hit.fdcId}  ${description}  (${Object.keys(per100g).length} nutrients)`);
      await sleep(200);
    } catch (e) {
      console.warn(`⚠️  ${slug}: ${(e as Error).message}`);
    }
  }

  const sortObj = <T>(o: Record<string, T>): Record<string, T> =>
    Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));
  fs.writeFileSync(OUT, JSON.stringify(sortObj(nutrients), null, 2) + '\n');
  fs.writeFileSync(MAP, JSON.stringify(sortObj(fdcMap), null, 2) + '\n');
  console.log(`\n✅ enriched ${ok}/${slugs.length} food(s) → data/usda/{nutrients.generated,fdc-map}.json`);
  console.log('Review the matched descriptions above, then commit the two files via PR.');
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
