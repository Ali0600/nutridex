/**
 * Distill per-100g nutrient values for our catalogued foods from USDA FoodData Central
 * bulk CSVs into `data/usda/nutrients.generated.json` (the only committed output).
 *
 * Keyless by design: the CSV downloads need no API key, so nothing here — or in CI, which
 * never runs this — depends on a secret. The raw CSVs (hundreds of MB) live in
 * `data/.cache/<dataset>/` (gitignored); see data/usda/README.md for the download URLs.
 *
 * Usage:  npm run usda:import
 *
 * FDC CSV shape used:
 *   food.csv           fdc_id, data_type, description, ...
 *   nutrient.csv       id, name, unit_name, nutrient_nbr, ...
 *   food_nutrient.csv  id, fdc_id, nutrient_id, amount, ...   (amount is per 100 g)
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse';
import { fdcMapFileSchema, type NutrientsFile } from '../src/lib/schema';
import { NUTRIENT_BY_NBR } from '../src/lib/nutrients-config';

const ROOT = process.cwd();
const CACHE = path.join(ROOT, 'data', '.cache');
const OUT = path.join(ROOT, 'data', 'usda', 'nutrients.generated.json');
const DATASETS = ['foundation', 'sr_legacy'] as const;

function readCsv(file: string): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, string>[] = [];
    fs.createReadStream(file)
      .pipe(parse({ columns: true, skip_empty_lines: true, relax_quotes: true }))
      .on('data', (r: Record<string, string>) => rows.push(r))
      .on('error', reject)
      .on('end', () => resolve(rows));
  });
}

/** Stream food_nutrient.csv (the big one) and keep only rows for target foods. */
function collectFoodNutrients(
  file: string,
  wantedFdcIds: Set<number>,
): Promise<Map<number, Map<number, number>>> {
  return new Promise((resolve, reject) => {
    const byFood = new Map<number, Map<number, number>>();
    fs.createReadStream(file)
      .pipe(parse({ columns: true, skip_empty_lines: true, relax_quotes: true }))
      .on('data', (r: Record<string, string>) => {
        const fdcId = Number(r.fdc_id);
        if (!wantedFdcIds.has(fdcId)) return;
        const nutrientId = Number(r.nutrient_id);
        const amount = Number(r.amount);
        if (!Number.isFinite(amount)) return;
        let m = byFood.get(fdcId);
        if (!m) byFood.set(fdcId, (m = new Map()));
        m.set(nutrientId, amount);
      })
      .on('error', reject)
      .on('end', () => resolve(byFood));
  });
}

async function main(): Promise<void> {
  const fdcMapPath = path.join(ROOT, 'data', 'usda', 'fdc-map.json');
  if (!fs.existsSync(fdcMapPath)) {
    console.error(`Missing ${path.relative(ROOT, fdcMapPath)} — nothing to import.`);
    process.exit(1);
  }
  const fdcMap = fdcMapFileSchema.parse(JSON.parse(fs.readFileSync(fdcMapPath, 'utf8')));

  // slug lookups per dataset
  const slugByFdcId = new Map<number, string>();
  const wantedByDataset = new Map<string, Set<number>>();
  for (const [slug, { fdcId, dataset }] of Object.entries(fdcMap)) {
    slugByFdcId.set(fdcId, slug);
    if (!wantedByDataset.has(dataset)) wantedByDataset.set(dataset, new Set());
    wantedByDataset.get(dataset)!.add(fdcId);
  }

  const out: NutrientsFile = {};
  let missingCache = 0;

  for (const dataset of DATASETS) {
    const wanted = wantedByDataset.get(dataset);
    if (!wanted || wanted.size === 0) continue;

    const dir = path.join(CACHE, dataset);
    const need = ['nutrient.csv', 'food.csv', 'food_nutrient.csv'];
    if (!need.every((f) => fs.existsSync(path.join(dir, f)))) {
      console.warn(
        `⚠️  ${dataset}: missing CSVs in ${path.relative(ROOT, dir)} — skipping ` +
          `${wanted.size} item(s). See data/usda/README.md for downloads.`,
      );
      missingCache++;
      continue;
    }

    // nutrient.csv → id → nutrient_nbr (only the nbrs we track)
    const nutrientIdToNbr = new Map<number, number>();
    for (const r of await readCsv(path.join(dir, 'nutrient.csv'))) {
      const nbr = Number(r.nutrient_nbr);
      if (NUTRIENT_BY_NBR[nbr]) nutrientIdToNbr.set(Number(r.id), nbr);
    }

    // food.csv → description for our targets
    const descByFdcId = new Map<number, string>();
    for (const r of await readCsv(path.join(dir, 'food.csv'))) {
      const fdcId = Number(r.fdc_id);
      if (wanted.has(fdcId)) descByFdcId.set(fdcId, r.description ?? '');
    }

    const perFood = await collectFoodNutrients(path.join(dir, 'food_nutrient.csv'), wanted);

    for (const fdcId of wanted) {
      const slug = slugByFdcId.get(fdcId)!;
      const nutrientMap = perFood.get(fdcId);
      if (!nutrientMap) {
        console.warn(`⚠️  ${slug}: fdcId ${fdcId} not found in ${dataset} food_nutrient.csv`);
        continue;
      }
      const per100g: Record<string, number> = {};
      for (const [nutrientId, amount] of nutrientMap) {
        const nbr = nutrientIdToNbr.get(nutrientId);
        if (nbr === undefined) continue;
        per100g[NUTRIENT_BY_NBR[nbr].key] = round(amount);
      }
      out[slug] = {
        fdcId,
        description: descByFdcId.get(fdcId) ?? slug,
        dataset,
        per100g,
      };
    }
  }

  // Stable key order for clean diffs
  const sorted: NutrientsFile = {};
  for (const slug of Object.keys(out).sort()) sorted[slug] = out[slug];
  fs.writeFileSync(OUT, JSON.stringify(sorted, null, 2) + '\n');
  console.log(
    `✅ wrote ${Object.keys(sorted).length} item(s) to ${path.relative(ROOT, OUT)}` +
      (missingCache ? ` (${missingCache} dataset(s) skipped — CSVs not cached)` : ''),
  );
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
