/**
 * Shared citation-integrity logic, used by BOTH entry points so they can never diverge:
 *   - `scripts/verify-citations.ts` (networked; refreshes data/citations.verified.json)
 *   - `scripts/validate-content.ts` (offline CI gate; asserts content against that cache)
 *
 * Why a cache instead of calling Europe PMC from the PR gate: an external API in the merge
 * path is a flaky gate. The network runs on a schedule; the merge gate is hermetic.
 *
 * What this catches (each was a real defect found in the 2026-07-20 audit of 147 citations):
 *   - a PMID that resolves to a completely different paper (kiwi cited an art-conservation
 *     paper for a protein-digestion claim)
 *   - a `year` that disagrees with the record (broccoli said 2015, the paper is 2014)
 *   - an invented author byline on an otherwise-correct paper (16 of 147)
 *   - a retracted paper
 *
 * What it deliberately does NOT check: the journal name. "PNAS" and "Proc Natl Acad Sci U S A"
 * are both correct, and there is no abbreviation map that makes that comparison sound.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, 'content');
export const CACHE_PATH = path.join(ROOT, 'data', 'citations.verified.json');

/** A citation as it appears in content, with enough provenance to report a useful error. */
export interface CiteRef {
  pmid: string;
  title: string;
  year?: number;
  where: string;
  context: string;
}

/** One resolved Europe PMC record, reduced to the fields the gate compares. */
export interface VerifiedRecord {
  title: string;
  firstAuthor: string;
  groupAuthor: boolean;
  /** Absent for books (StatPearls et al.) — journal is never compared, only used to spot books. */
  journal: string | null;
  year: number | null;
  retracted: boolean;
  errata: string[];
  checkedAt: string;
}

export type VerifiedCache = Record<string, VerifiedRecord>;

/**
 * Corporate/consortium authors ("Age-Related Eye Disease Study 2 Research Group") are cited by
 * their acronym (AREDS2), so a surname comparison is meaningless for them.
 */
const GROUP_AUTHOR = /group|collaborat|committee|consortium|network|investigators|society/i;

export function isGroupAuthor(authorString: string): boolean {
  const first = authorString.split(',')[0] ?? '';
  return GROUP_AUTHOR.test(first);
}

/** "Nikkhah Bodagh M." -> "Nikkhah Bodagh" (drop trailing initials, keep multi-word surnames). */
export function surnameOf(author: string): string {
  const cleaned = author.trim().replace(/\.$/, '');
  const tokens = cleaned.split(/\s+/);
  while (tokens.length > 1 && /^[A-Z]{1,3}$/.test(tokens[tokens.length - 1]!)) tokens.pop();
  return tokens.join(' ');
}

/**
 * Is `claimed` the leading name of `actual`? Matches on a word boundary so "Wang" matches
 * "Wang HP" but not "Wanganui X".
 */
export function startsWithName(actual: string, claimed: string): boolean {
  const a = actual.toLowerCase();
  const c = claimed.toLowerCase();
  if (!a.startsWith(c)) return false;
  const next = a.charAt(c.length);
  return next === '' || next === ' ' || next === ',' || next === '.';
}

/** The trailing "(Author et al., Journal Year)" of a stored title, if present. */
export function bylineOf(title: string): string | null {
  const m = /\(([^()]*(?:\([^()]*\)[^()]*)*)\)\s*$/.exec(title);
  return m ? m[1]! : null;
}

/** The stored title with its byline stripped, for comparison against the record's title. */
export function stemOf(title: string): string {
  return title.replace(/\s*\(([^()]*(?:\([^()]*\)[^()]*)*)\)\s*$/, '').trim();
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Token containment, not Jaccard: stored titles are sometimes lightly edited and the record's
 * title may carry a trailing period or subtitle. Measured on the real corpus, the one wrong
 * citation scored 0.08 and the next-lowest correct one scored 0.93 — so 0.6 sits in a very
 * wide empty band rather than being tuned to the data.
 */
export const TITLE_MATCH_THRESHOLD = 0.6;

export function titleOverlap(a: string, b: string): number {
  const A = new Set(normalize(a).split(' ').filter(Boolean));
  const B = new Set(normalize(b).split(' ').filter(Boolean));
  if (!A.size || !B.size) return 0;
  let hit = 0;
  for (const t of A) if (B.has(t)) hit++;
  return hit / Math.min(A.size, B.size);
}

/**
 * Compare one content citation against its authoritative record.
 * Returns human-readable problems; empty means the citation checks out.
 */
export function checkCitation(ref: CiteRef, rec: VerifiedRecord | undefined): string[] {
  const problems: string[] = [];
  if (!rec) {
    return [
      `pmid ${ref.pmid} is not in data/citations.verified.json — run \`npm run citations:verify\``,
    ];
  }

  if (rec.retracted) problems.push(`pmid ${ref.pmid} is a RETRACTED publication`);

  const overlap = titleOverlap(stemOf(ref.title), rec.title);
  if (overlap < TITLE_MATCH_THRESHOLD) {
    problems.push(
      `pmid ${ref.pmid} title does not match the record (overlap ${overlap.toFixed(2)}); ` +
        `record is "${rec.title}"`,
    );
  }

  if (ref.year != null && rec.year != null && ref.year !== rec.year) {
    problems.push(`pmid ${ref.pmid} year ${ref.year} but the record says ${rec.year}`);
  }

  // Author byline. Exempt corporate authors (cited by acronym) and books (no journal, e.g.
  // StatPearls), where a first-author surname is not how the source is conventionally named.
  const byline = bylineOf(ref.title);
  if (byline && !rec.groupAuthor && rec.journal) {
    const authorPart = byline.split(',')[0]!.trim();
    const looksLikeAuthor = /[A-Za-z]/.test(authorPart) && !/^\d{4}$/.test(authorPart);
    if (looksLikeAuthor) {
      const claimed = authorPart
        .replace(/\s+et\s+al\.?$/i, '')
        .replace(/\s*&.*$/, '')
        .trim();
      // Prefix match rather than equality: the record appends initials to the surname, and
      // those are not reliably strippable ("Ramirez-Ahumada Mdel C" is a real Europe PMC
      // rendering of "M. del C."). A surname is a prefix of "<surname> <initials>"; a wrong
      // name is not ("Yagishita" is not a prefix of "Conzatti A").
      const actual = rec.firstAuthor.trim();
      if (claimed && actual && !startsWithName(actual, claimed)) {
        problems.push(
          `pmid ${ref.pmid} byline names "${claimed}" but the first author is "${surnameOf(actual)}"`,
        );
      }
    }
  }

  return problems;
}

/** Walk every content file and collect each citation that carries a PMID. */
export function collectCitations(): CiteRef[] {
  const out: CiteRef[] = [];
  const push = (c: { pmid?: string; title: string; year?: number }, where: string, context: string) => {
    if (c.pmid) out.push({ pmid: c.pmid, title: c.title, year: c.year, where, context });
  };

  const itemsDir = path.join(CONTENT, 'items');
  if (fs.existsSync(itemsDir)) {
    for (const category of fs.readdirSync(itemsDir)) {
      const dir = path.join(itemsDir, category);
      if (!fs.statSync(dir).isDirectory()) continue;
      for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
        const where = `items/${category}/${file}`;
        const item = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
        for (const b of item.benefits ?? []) {
          for (const c of b.citations ?? []) push(c, where, `benefit "${b.claim}"`);
        }
        for (const f of item.surprisingFacts ?? []) {
          if (f.citation) push(f.citation, where, `fact "${String(f.text).slice(0, 40)}…"`);
        }
        for (const ca of item.cautions ?? []) {
          for (const c of ca.citations ?? []) push(c, where, `caution "${String(ca.effect).slice(0, 40)}…"`);
        }
      }
    }
  }

  for (const name of ['compounds.json', 'conditions.json', 'organs.json']) {
    const p = path.join(CONTENT, name);
    if (!fs.existsSync(p)) continue;
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (!Array.isArray(data)) continue;
    for (const entry of data) {
      for (const c of entry.citations ?? []) push(c, name, `${entry.id}`);
    }
  }

  return out;
}

export function readCache(): VerifiedCache {
  if (!fs.existsSync(CACHE_PATH)) return {};
  return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')) as VerifiedCache;
}
