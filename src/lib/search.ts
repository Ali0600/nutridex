import type { Item } from './schema';

/**
 * Dependency-free food search. The catalogue is small (tens of items), so instead of a search
 * library we build a lightweight per-item document and score it against the query's tokens,
 * weighting name/alias hits above summary above benefit text and tags. Pure and unit-tested;
 * used by the `/items` search page.
 */

export interface SearchDoc {
  slug: string;
  name: string;
  aliases: string[];
  summary: string;
  category: string;
  /** organ + condition ids referenced by any benefit */
  tags: string[];
  /** benefit claims, so "lower blood pressure" finds beetroot etc. */
  claims: string[];
}

export function toSearchDoc(item: Item): SearchDoc {
  return {
    slug: item.slug,
    name: item.name,
    aliases: item.aliases,
    summary: item.summary,
    category: item.category,
    tags: [...new Set(item.benefits.flatMap((b) => [...b.organs, ...b.conditions]))],
    claims: item.benefits.map((b) => b.claim),
  };
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Score one document against the already-tokenized query. 0 = no match. */
export function scoreDoc(doc: SearchDoc, terms: string[]): number {
  if (terms.length === 0) return 0;
  const name = doc.name.toLowerCase();
  const aliases = doc.aliases.map((a) => a.toLowerCase());
  const summary = doc.summary.toLowerCase();
  const tags = doc.tags.map((t) => t.toLowerCase());
  const claims = doc.claims.join(' ').toLowerCase();

  let score = 0;
  let matchedTerms = 0;

  for (const term of terms) {
    let termScore = 0;
    if (name === term) termScore = 100;
    else if (name.startsWith(term)) termScore = 60;
    else if (name.includes(term)) termScore = 40;
    if (aliases.some((a) => a === term)) termScore = Math.max(termScore, 55);
    else if (aliases.some((a) => a.includes(term))) termScore = Math.max(termScore, 30);
    if (tags.some((t) => t === term)) termScore = Math.max(termScore, 25);
    else if (tags.some((t) => t.includes(term))) termScore = Math.max(termScore, 15);
    if (summary.includes(term)) termScore = Math.max(termScore, 12);
    if (claims.includes(term)) termScore = Math.max(termScore, 10);

    if (termScore > 0) matchedTerms++;
    score += termScore;
  }

  // Require every query term to hit something (AND semantics) — avoids noisy partial matches.
  if (matchedTerms < terms.length) return 0;
  return score;
}

/** Rank items by relevance to `query`. Empty query returns all items, name-sorted. */
export function searchItems(items: Item[], query: string): Item[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [...items].sort((a, b) => a.name.localeCompare(b.name));

  return items
    .map((item) => ({ item, score: scoreDoc(toSearchDoc(item), terms) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
    .map((r) => r.item);
}
