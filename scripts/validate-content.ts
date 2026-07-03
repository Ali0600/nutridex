/**
 * CI gate for the content database (`npm run content:validate`). Beyond the per-file zod
 * schema, this enforces cross-file referential integrity that a single-file schema can't
 * see: every organ/condition tag must exist, every fdcId must be mapped, and every mapped
 * item must have generated nutrient data. Exits non-zero on the first batch of errors so a
 * bad content PR fails the build.
 */
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import {
  CATEGORIES,
  conditionsFileSchema,
  fdcMapFileSchema,
  itemSchema,
  nutrientsFileSchema,
  organsFileSchema,
} from '../src/lib/schema';

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, 'content');
const USDA = path.join(ROOT, 'data', 'usda');

const errors: string[] = [];
const warnings: string[] = [];
const err = (m: string) => errors.push(m);
const warn = (m: string) => warnings.push(m);

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function zodErrors(where: string, e: z.ZodError): void {
  for (const issue of e.issues) {
    err(`${where}: ${issue.path.join('.') || '(root)'} — ${issue.message}`);
  }
}

// --- Tag vocabularies -------------------------------------------------------
let organIds = new Set<string>();
let conditionIds = new Set<string>();

try {
  const organs = organsFileSchema.parse(readJson(path.join(CONTENT, 'organs.json')));
  organIds = new Set(organs.map((o) => o.id));
} catch (e) {
  if (e instanceof z.ZodError) zodErrors('organs.json', e);
  else err(`organs.json: ${(e as Error).message}`);
}

try {
  const conditions = conditionsFileSchema.parse(readJson(path.join(CONTENT, 'conditions.json')));
  conditionIds = new Set(conditions.map((c) => c.id));
  for (const c of conditions) {
    for (const o of c.organs) {
      if (!organIds.has(o)) err(`conditions.json: condition "${c.id}" references unknown organ "${o}"`);
    }
  }
} catch (e) {
  if (e instanceof z.ZodError) zodErrors('conditions.json', e);
  else err(`conditions.json: ${(e as Error).message}`);
}

// --- USDA maps --------------------------------------------------------------
let fdcMap: Record<string, unknown> = {};
let nutrients: Record<string, { per100g: Record<string, number> }> = {};
const fdcMapPath = path.join(USDA, 'fdc-map.json');
const nutrientsPath = path.join(USDA, 'nutrients.generated.json');

if (fs.existsSync(fdcMapPath)) {
  try {
    fdcMap = fdcMapFileSchema.parse(readJson(fdcMapPath));
  } catch (e) {
    if (e instanceof z.ZodError) zodErrors('fdc-map.json', e);
  }
}
if (fs.existsSync(nutrientsPath)) {
  try {
    nutrients = nutrientsFileSchema.parse(readJson(nutrientsPath));
  } catch (e) {
    if (e instanceof z.ZodError) zodErrors('nutrients.generated.json', e);
  }
}

// --- Items ------------------------------------------------------------------
const slugs = new Set<string>();
let itemCount = 0;

for (const category of CATEGORIES) {
  const dir = path.join(CONTENT, 'items', category);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const where = `items/${category}/${file}`;
    let item: z.infer<typeof itemSchema>;
    try {
      item = itemSchema.parse(readJson(path.join(dir, file)));
    } catch (e) {
      if (e instanceof z.ZodError) zodErrors(where, e);
      else err(`${where}: ${(e as Error).message}`);
      continue;
    }
    itemCount++;

    if (item.slug !== file.replace(/\.json$/, '')) err(`${where}: slug "${item.slug}" != filename`);
    if (item.category !== category) err(`${where}: category "${item.category}" != folder "${category}"`);
    if (slugs.has(item.slug)) err(`${where}: duplicate slug "${item.slug}"`);
    slugs.add(item.slug);

    for (const b of item.benefits) {
      for (const o of b.organs) {
        if (!organIds.has(o)) err(`${where}: benefit references unknown organ "${o}"`);
      }
      for (const c of b.conditions) {
        if (!conditionIds.has(c)) err(`${where}: benefit references unknown condition "${c}"`);
      }
    }

    if (item.fdcId) {
      const mapped = fdcMap[item.slug] as { fdcId?: number } | undefined;
      if (!mapped) warn(`${where}: fdcId set but "${item.slug}" missing from fdc-map.json`);
      else if (mapped.fdcId !== item.fdcId) {
        err(`${where}: fdcId ${item.fdcId} != fdc-map.json ${mapped.fdcId}`);
      }
      if (!nutrients[item.slug]) {
        warn(`${where}: no nutrient data yet for "${item.slug}" (run npm run usda:import)`);
      }
    }
  }
}

// --- Report -----------------------------------------------------------------
for (const w of warnings) console.warn(`⚠️  ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`❌ ${e}`);
  console.error(`\ncontent:validate — ${errors.length} error(s) across ${itemCount} item(s)`);
  process.exit(1);
}
console.log(
  `✅ content:validate — ${itemCount} item(s), ${organIds.size} organs, ${conditionIds.size} conditions${
    warnings.length ? `, ${warnings.length} warning(s)` : ''
  }`,
);
