/**
 * Shared Europe PMC (europepmc.org) client — keyless literature search used by both the
 * `research` CLI (scripts/research.ts) and the auto-blog helper (scripts/blog-research.ts).
 * Europe PMC indexes PubMed + PMC + Agricola + preprints, returns abstracts and publication
 * types, and needs no API key. Author-side only; never imported by the app or CI build.
 */

const EPMC = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search';
export const THIS_YEAR = new Date().getFullYear();

/** Matches the schema's Citation shape (src/lib/schema.ts) so results paste straight in. */
export interface Citation {
  title: string;
  source: 'PubMed' | 'PMC' | 'DOI' | 'other';
  url: string;
  pmid?: string;
  year?: number;
}

export interface SearchOpts {
  type?: 'meta' | 'review' | 'rct' | 'any';
  since?: number;
  sort?: 'recent' | 'cited' | 'relevance';
  limit?: number;
  openOnly?: boolean;
  includePreprints?: boolean;
}

export interface StudyResult {
  citation: Citation;
  evidence: string; // 'meta-analysis' | 'systematic review' | 'RCT' | 'review' | 'study' | 'preprint'
  strength: 'strong' | 'moderate' | 'preliminary';
  citedByCount: number;
  year?: number;
  pmid?: string;
  journal?: string;
  isOpenAccess: boolean;
  abstract?: string; // trimmed snippet, so authors can write accurately without extra calls
  rawTitle: string;
}

interface EpmcResult {
  source: string;
  pmid?: string;
  pmcid?: string;
  doi?: string;
  title?: string;
  authorString?: string;
  pubYear?: string;
  citedByCount?: number;
  isOpenAccess?: string;
  abstractText?: string;
  pubTypeList?: { pubType?: string[] | string };
  journalInfo?: { journal?: { title?: string } };
}

function num(v?: string): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function pubTypes(r: EpmcResult): string[] {
  const pt = r.pubTypeList?.pubType;
  if (!pt) return [];
  return (Array.isArray(pt) ? pt : [pt]).map((s) => s.toLowerCase());
}

export function evidenceLabel(r: EpmcResult): string {
  const types = pubTypes(r);
  if (types.some((t) => t.includes('meta-analysis'))) return 'meta-analysis';
  if (types.some((t) => t.includes('systematic review'))) return 'systematic review';
  if (types.some((t) => t.includes('randomized controlled trial'))) return 'RCT';
  if (types.some((t) => t.includes('review'))) return 'review';
  if (r.source === 'PPR') return 'preprint';
  return 'study';
}

function suggestedStrength(r: EpmcResult): StudyResult['strength'] {
  const types = pubTypes(r);
  if (types.some((t) => t.includes('meta-analysis') || t.includes('systematic review'))) return 'strong';
  if (types.some((t) => t.includes('randomized controlled trial') || t.includes('review'))) return 'moderate';
  return 'preliminary';
}

function toCitation(r: EpmcResult): Citation {
  const firstAuthor = (r.authorString ?? '').split(',')[0]?.trim();
  const journal = r.journalInfo?.journal?.title;
  const suffix = [firstAuthor && `${firstAuthor} et al.`, journal, r.pubYear].filter(Boolean).join(', ');
  const title = suffix ? `${r.title?.replace(/\.$/, '')} (${suffix})` : (r.title ?? 'Untitled');

  if (r.pmid) {
    return { title, source: 'PubMed', url: `https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/`, pmid: r.pmid, year: num(r.pubYear) };
  }
  if (r.pmcid) {
    return { title, source: 'PMC', url: `https://pmc.ncbi.nlm.nih.gov/articles/${r.pmcid}/`, year: num(r.pubYear) };
  }
  if (r.doi) {
    return { title, source: 'DOI', url: `https://doi.org/${r.doi}`, year: num(r.pubYear) };
  }
  return { title, source: 'other', url: 'https://europepmc.org/', year: num(r.pubYear) };
}

const EVIDENCE_RANK: Record<string, number> = {
  'meta-analysis': 5,
  'systematic review': 4,
  RCT: 3,
  review: 2,
  study: 1,
  preprint: 0,
};

function buildQuery(terms: string[], opts: SearchOpts): string {
  const parts = terms.map((t) => (t.includes(' ') ? `"${t}"` : t));
  const clauses = [parts.join(' AND ')];
  if (opts.type === 'meta') clauses.push('(PUB_TYPE:"Meta-Analysis" OR PUB_TYPE:"Systematic Review")');
  else if (opts.type === 'review') clauses.push('PUB_TYPE:"Review"');
  else if (opts.type === 'rct') clauses.push('PUB_TYPE:"Randomized Controlled Trial"');
  if (opts.since) clauses.push(`(PUB_YEAR:[${opts.since} TO ${THIS_YEAR}])`);
  if (opts.openOnly) clauses.push('OPEN_ACCESS:Y');
  return clauses.join(' AND ');
}

function trimAbstract(text?: string, max = 700): string | undefined {
  if (!text) return undefined;
  const clean = text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? clean.slice(0, max - 1) + '…' : clean;
}

/**
 * Search Europe PMC. Returns enriched, ranked results. `hitCount` on the array-like isn't
 * returned; callers that need the total should use `searchEuropePmcRaw`.
 */
export async function searchEuropePmc(terms: string[], opts: SearchOpts = {}): Promise<StudyResult[]> {
  const { results } = await searchEuropePmcRaw(terms, opts);
  return results;
}

export async function searchEuropePmcRaw(
  terms: string[],
  opts: SearchOpts = {},
): Promise<{ hitCount: number; query: string; results: StudyResult[] }> {
  if (terms.length === 0) throw new Error('give at least one search term');
  const limit = Math.min(25, Math.max(1, opts.limit ?? 10));
  const sort = opts.sort ?? (opts.since ? 'recent' : 'relevance');
  const query = buildQuery(terms, opts);
  const sortParam = sort === 'recent' ? '&sort=P_PDATE_D%20desc' : sort === 'cited' ? '&sort=CITED%20desc' : '';
  const url = `${EPMC}?query=${encodeURIComponent(query)}&format=json&pageSize=${Math.min(25, limit * 2)}&resultType=core${sortParam}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': process.env.NUTRIDEX_CONTACT_EMAIL
        ? `NutriDex-research (${process.env.NUTRIDEX_CONTACT_EMAIL})`
        : 'NutriDex-research',
    },
  });
  if (!res.ok) throw new Error(`Europe PMC error ${res.status}`);
  const data = (await res.json()) as { hitCount: number; resultList?: { result?: EpmcResult[] } };

  let raw = data.resultList?.result ?? [];
  if (!opts.includePreprints) raw = raw.filter((r) => r.source !== 'PPR');
  if (sort === 'relevance') {
    raw.sort(
      (x, y) =>
        (EVIDENCE_RANK[evidenceLabel(y)] ?? 0) - (EVIDENCE_RANK[evidenceLabel(x)] ?? 0) ||
        (y.citedByCount ?? 0) - (x.citedByCount ?? 0) ||
        (num(y.pubYear) ?? 0) - (num(x.pubYear) ?? 0),
    );
  }
  raw = raw.slice(0, limit);

  const results: StudyResult[] = raw.map((r) => ({
    citation: toCitation(r),
    evidence: evidenceLabel(r),
    strength: suggestedStrength(r),
    citedByCount: r.citedByCount ?? 0,
    year: num(r.pubYear),
    pmid: r.pmid,
    journal: r.journalInfo?.journal?.title,
    isOpenAccess: r.isOpenAccess === 'Y',
    abstract: trimAbstract(r.abstractText),
    rawTitle: r.title ?? 'Untitled',
  }));

  return { hitCount: data.hitCount, query, results };
}
