import fs from 'node:fs';
import path from 'node:path';
import {
  CATEGORIES,
  type Category,
  type Compound,
  type Condition,
  type Item,
  type NutrientsFile,
  type Organ,
  compoundsFileSchema,
  conditionsFileSchema,
  itemSchema,
  nutrientsFileSchema,
  organsFileSchema,
} from './schema';

/**
 * Filesystem source-of-truth loaders. These run at build time (static generation) and in
 * the validation script — never in the browser. Everything is parsed through the zod
 * schemas so a page can trust its data. Results are memoized per process so a build reads
 * each file once.
 */

const CONTENT_DIR = path.join(process.cwd(), 'content');
const DATA_DIR = path.join(process.cwd(), 'data', 'usda');

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

let _items: Item[] | null = null;
export function getItems(): Item[] {
  if (_items) return _items;
  const items: Item[] = [];
  for (const category of CATEGORIES) {
    const dir = path.join(CONTENT_DIR, 'items', category);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      const raw = readJson(path.join(dir, file));
      const item = itemSchema.parse(raw);
      if (item.slug !== file.replace(/\.json$/, '')) {
        throw new Error(`slug "${item.slug}" != filename "${file}" in ${category}/`);
      }
      if (item.category !== category) {
        throw new Error(`item ${item.slug} category "${item.category}" != folder "${category}"`);
      }
      items.push(item);
    }
  }
  items.sort((a, b) => a.name.localeCompare(b.name));
  _items = items;
  return items;
}

export function getItem(slug: string): Item | undefined {
  return getItems().find((i) => i.slug === slug);
}

export function getItemsByCategory(category: Category): Item[] {
  return getItems().filter((i) => i.category === category);
}

export function getSuperfoods(): Item[] {
  return getItems().filter((i) => i.superfood);
}

let _organs: Organ[] | null = null;
export function getOrgans(): Organ[] {
  if (!_organs) _organs = organsFileSchema.parse(readJson(path.join(CONTENT_DIR, 'organs.json')));
  return _organs;
}

let _conditions: Condition[] | null = null;
export function getConditions(): Condition[] {
  if (!_conditions) {
    _conditions = conditionsFileSchema.parse(readJson(path.join(CONTENT_DIR, 'conditions.json')));
  }
  return _conditions;
}

export function getCondition(id: string): Condition | undefined {
  return getConditions().find((c) => c.id === id);
}

let _compounds: Compound[] | null = null;
export function getCompounds(): Compound[] {
  if (!_compounds) {
    _compounds = compoundsFileSchema.parse(readJson(path.join(CONTENT_DIR, 'compounds.json')));
  }
  return _compounds;
}

export function getCompound(id: string): Compound | undefined {
  return getCompounds().find((c) => c.id === id);
}

/**
 * Items that contain the given compound. NOTE: the length of this is a fact about *our*
 * database, not about the diet — the compound's own `rarity`/`distribution` is the
 * real-world claim. Don't render this count as rarity.
 */
export function getItemsForCompound(compoundId: string): Item[] {
  return getItems().filter((i) => i.compounds.includes(compoundId));
}

/** Compound records for a given item, in the order the item lists them. */
export function getCompoundsForItem(item: Item): Compound[] {
  return item.compounds.map((id) => getCompound(id)).filter((c): c is Compound => Boolean(c));
}

/** Items whose any benefit is tagged with the given organ id. */
export function getItemsForOrgan(organId: string): Item[] {
  return getItems().filter((i) => i.benefits.some((b) => b.organs.includes(organId)));
}

/** Items whose any benefit is tagged with the given condition id. */
export function getItemsForCondition(conditionId: string): Item[] {
  return getItems().filter((i) => i.benefits.some((b) => b.conditions.includes(conditionId)));
}

let _nutrients: NutrientsFile | null = null;
export function getNutrientsFile(): NutrientsFile {
  if (_nutrients) return _nutrients;
  const file = path.join(DATA_DIR, 'nutrients.generated.json');
  _nutrients = fs.existsSync(file) ? nutrientsFileSchema.parse(readJson(file)) : {};
  return _nutrients;
}
