/**
 * Keyless literature search over Europe PMC (europepmc.org) — finds citation-ready studies
 * for authoring database entries and blog posts, so citations come from a real index rather
 * than memory. No API key or account, matching the project's keyless ethos (like the USDA
 * importer, this is author-side only and never runs in CI/build).
 *
 * Europe PMC indexes PubMed + PMC + Agricola + preprints, returns abstracts and publication
 * types, and is free to query. https://europepmc.org/RestfulWebService
 *
 * Usage:
 *   npm run research -- kiwi sleep
 *   npm run research -- "green tea" cholesterol --type meta --since 2018
 *   npm run research -- beetroot "blood pressure" --recent           # last 3 years
 *   npm run research -- broccoli lung --json                         # citation-ready JSON
 *
 * Flags:
 *   --type meta|review|rct|any   evidence filter (default: any; meta/review/rct boost quality)
 *   --since <year>               only studies from <year> onward
 *   --recent                     shortcut for --since (current year - 3)
 *   --sort recent|cited|relevance   default: relevance (recent when --recent/--since set)
 *   --limit <n>                  results (default 10, max 25)
 *   --open                       only open-access (full text available)
 *   --include-preprints          include non-peer-reviewed preprints (excluded by default)
 *   --json                       emit an array of schema-shaped Citation objects
 */

const EPMC = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search';
const THIS_YEAR = new Date().getFullYear();

interface Args {
  terms: string[];
  type: 'meta' | 'review' | 'rct' | 'any';
  since?: number;
  sort: 'recent' | 'cited' | 'relevance';
  limit: number;
  openOnly: boolean;
  includePreprints: boolean;
  json: boolean;
}

function parseArgs(argv: string[]): Args {
  const a: Args = {
    terms: [],
    type: 'any',
    sort: 'relevance',
    limit: 10,
    openOnly: false,
    includePreprints: false,
    json: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--type':
        a.type = argv[++i] as Args['type'];
        break;
      case '--since':
        a.since = Number(argv[++i]);
        break;
      case '--recent':
        a.since = THIS_YEAR - 3;
        a.sort = 'recent';
        break;
      case '--sort':
        a.sort = argv[++i] as Args['sort'];
        break;
      case '--limit':
        a.limit = Math.min(25, Math.max(1, Number(argv[++i]) || 10));
        break;
      case '--open':
        a.openOnly = true;
        break;
      case '--include-preprints':
        a.includePreprints = true;
        break;
      case '--json':
        a.json = true;
        break;
      default:
        if (arg.startsWith('--')) throw new Error(`unknown flag: ${arg}`);
        a.terms.push(arg);
    }
  }
  if (a.terms.length === 0) throw new Error('give at least one search term');
  return a;
}

function buildQuery(a: Args): string {
  // Quote multi-word terms so Europe PMC treats them as phrases.
  const parts = a.terms.map((t) => (t.includes(' ') ? `"${t}"` : t));
  const clauses = [parts.join(' AND ')];

  if (a.type === 'meta') clauses.push('(PUB_TYPE:"Meta-Analysis" OR PUB_TYPE:"Systematic Review")');
  else if (a.type === 'review') clauses.push('PUB_TYPE:"Review"');
  else if (a.type === 'rct') clauses.push('PUB_TYPE:"Randomized Controlled Trial"');

  if (a.since) clauses.push(`(PUB_YEAR:[${a.since} TO ${THIS_YEAR}])`);
  if (a.openOnly) clauses.push('OPEN_ACCESS:Y');
  return clauses.join(' AND ');
}

interface EpmcResult {
  source: string;
  id?: string;
  pmid?: string;
  pmcid?: string;
  doi?: string;
  title?: string;
  authorString?: string;
  pubYear?: string;
  citedByCount?: number;
  isOpenAccess?: string;
  pubTypeList?: { pubType?: string[] | string };
  journalInfo?: { journal?: { title?: string } };
}

interface Citation {
  title: string;
  source: 'PubMed' | 'PMC' | 'DOI' | 'other';
  url: string;
  pmid?: string;
  year?: number;
}

function pubTypes(r: EpmcResult): string[] {
  const pt = r.pubTypeList?.pubType;
  if (!pt) return [];
  return (Array.isArray(pt) ? pt : [pt]).map((s) => s.toLowerCase());
}

/** Map a result's publication types to a suggested schema `strength`. */
function suggestedStrength(r: EpmcResult): 'strong' | 'moderate' | 'preliminary' {
  const types = pubTypes(r);
  if (types.some((t) => t.includes('meta-analysis') || t.includes('systematic review'))) return 'strong';
  if (types.some((t) => t.includes('randomized controlled trial'))) return 'moderate';
  if (types.some((t) => t.includes('review'))) return 'moderate';
  return 'preliminary';
}

function evidenceLabel(r: EpmcResult): string {
  const types = pubTypes(r);
  if (types.some((t) => t.includes('meta-analysis'))) return 'meta-analysis';
  if (types.some((t) => t.includes('systematic review'))) return 'systematic review';
  if (types.some((t) => t.includes('randomized controlled trial'))) return 'RCT';
  if (types.some((t) => t.includes('review'))) return 'review';
  if (r.source === 'PPR') return 'preprint';
  return 'study';
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

function num(v?: string): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

const EVIDENCE_RANK: Record<string, number> = {
  'meta-analysis': 5,
  'systematic review': 4,
  RCT: 3,
  review: 2,
  study: 1,
  preprint: 0,
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const query = buildQuery(args);
  const sortParam =
    args.sort === 'recent' ? '&sort=P_PDATE_D%20desc' : args.sort === 'cited' ? '&sort=CITED%20desc' : '';
  const url = `${EPMC}?query=${encodeURIComponent(query)}&format=json&pageSize=${Math.min(25, args.limit * 2)}&resultType=core${sortParam}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': process.env.NUTRIDEX_CONTACT_EMAIL ? `NutriDex-research (${process.env.NUTRIDEX_CONTACT_EMAIL})` : 'NutriDex-research' },
  });
  if (!res.ok) {
    console.error(`Europe PMC error ${res.status}`);
    process.exit(1);
  }
  const data = (await res.json()) as { hitCount: number; resultList?: { result?: EpmcResult[] } };
  let results = data.resultList?.result ?? [];
  if (!args.includePreprints) results = results.filter((r) => r.source !== 'PPR');

  // Rank by evidence tier, then citations, then recency — unless an explicit sort was requested.
  if (args.sort === 'relevance') {
    results.sort(
      (x, y) =>
        (EVIDENCE_RANK[evidenceLabel(y)] ?? 0) - (EVIDENCE_RANK[evidenceLabel(x)] ?? 0) ||
        (y.citedByCount ?? 0) - (x.citedByCount ?? 0) ||
        (num(y.pubYear) ?? 0) - (num(x.pubYear) ?? 0),
    );
  }
  results = results.slice(0, args.limit);

  if (args.json) {
    console.log(JSON.stringify(results.map(toCitation), null, 2));
    return;
  }

  console.log(`\nEurope PMC · "${query}" · ${data.hitCount.toLocaleString()} hits, showing ${results.length}\n`);
  results.forEach((r, i) => {
    const c = toCitation(r);
    const oa = r.isOpenAccess === 'Y' ? ' · full text' : '';
    console.log(`${String(i + 1).padStart(2)}. [${evidenceLabel(r)} · cited ${r.citedByCount ?? 0}${oa}] ${r.pubYear ?? ''}`);
    console.log(`    ${r.title}`);
    console.log(`    ${r.journalInfo?.journal?.title ?? ''}`);
    console.log(`    ${c.url}   → strength: "${suggestedStrength(r)}"`);
    console.log('');
  });
  console.log('Add --json to emit copy-paste Citation objects for content/items/*.json.\n');
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
