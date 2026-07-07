import { describe, expect, it } from 'vitest';
import { GET as health } from './health/route';
import { GET as categories } from './categories/route';
import { GET as items } from './items/route';
import { GET as conditions } from './conditions/route';
import { GET as organs } from './organs/route';
import { GET as dataset } from './dataset/route';
import { GET as itemBySlug } from './items/[slug]/route';
import { GET as nutrientRanking } from './nutrients/[nutrient]/route';

const req = new Request('http://test/api');
const ctx = <T>(params: T) => ({ params: Promise.resolve(params) });

async function body(res: Response) {
  expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  return res.json();
}

describe('GET /api/v1 route handlers', () => {
  it('health reports ok + version, with CORS', async () => {
    expect(await body(await health())).toEqual({ ok: true, api: 'v1' });
  });

  it('categories lists every category with a count (incl. oils)', async () => {
    const data = await body(await categories());
    const oils = data.categories.find((c: { id: string }) => c.id === 'oils');
    expect(oils).toMatchObject({ id: 'oils', label: 'Oils' });
    expect(oils.count).toBeGreaterThan(0);
  });

  it('items returns a non-empty list of well-formed entries', async () => {
    const data = await body(await items());
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBeGreaterThan(0);
    for (const i of data.items) {
      expect(typeof i.slug).toBe('string');
      expect(i.benefits.length).toBeGreaterThan(0);
    }
  });

  it('conditions and organs return their collections', async () => {
    expect((await body(await conditions())).conditions.length).toBeGreaterThan(0);
    expect((await body(await organs())).organs.length).toBeGreaterThan(0);
  });

  it('dataset bundles the whole corpus with a version + timestamp', async () => {
    const data = await body(await dataset());
    expect(data.version).toBe('v1');
    expect(() => new Date(data.generatedAt).toISOString()).not.toThrow();
    expect(data.items.length).toBeGreaterThan(0);
    expect(data.nutrients).toBeTypeOf('object');
  });

  it('item-by-slug returns the item for a real slug', async () => {
    const data = await body(await itemBySlug(req, ctx({ slug: 'salmon' })));
    expect(data).toMatchObject({ slug: 'salmon', category: 'meats' });
  });

  it('item-by-slug returns a not-found shape for a bogus slug', async () => {
    const data = await body(await itemBySlug(req, ctx({ slug: 'does-not-exist' })));
    expect(data).toMatchObject({ error: 'not found', slug: 'does-not-exist' });
  });

  it('nutrient ranking returns an ordered list for a real nutrient', async () => {
    const data = await body(await nutrientRanking(req, ctx({ nutrient: 'vitamin-c' })));
    expect(data.nutrient.key).toBe('vitamin-c');
    expect(data.ranking.length).toBeGreaterThan(0);
    const amounts = data.ranking.map((r: { amount: number }) => r.amount);
    expect(amounts).toEqual([...amounts].sort((a, b) => b - a));
  });

  it('nutrient ranking rejects an unknown nutrient', async () => {
    const data = await body(await nutrientRanking(req, ctx({ nutrient: 'unobtainium' })));
    expect(data).toMatchObject({ error: 'unknown nutrient', nutrient: 'unobtainium' });
  });
});
