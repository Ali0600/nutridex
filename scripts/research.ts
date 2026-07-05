/**
 * Keyless literature search over Europe PMC (europepmc.org) — finds citation-ready studies
 * for authoring database entries and blog posts, so citations come from a real index rather
 * than memory. No API key or account, matching the project's keyless ethos (like the USDA
 * importer, this is author-side only and never runs in CI/build). The Europe PMC client lives
 * in scripts/lib/epmc.ts and is shared with the auto-blog helper (scripts/blog-research.ts).
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
import { searchEuropePmcRaw, THIS_YEAR, type SearchOpts } from './lib/epmc';

interface Args extends SearchOpts {
  terms: string[];
  json: boolean;
}

function parseArgs(argv: string[]): Args {
  const a: Args = { terms: [], type: 'any', sort: undefined, limit: 10, json: false };
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
        a.limit = Number(argv[++i]) || 10;
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

async function main(): Promise<void> {
  const { terms, json, ...opts } = parseArgs(process.argv.slice(2));
  const { hitCount, query, results } = await searchEuropePmcRaw(terms, opts);

  if (json) {
    console.log(JSON.stringify(results.map((r) => r.citation), null, 2));
    return;
  }

  console.log(`\nEurope PMC · "${query}" · ${hitCount.toLocaleString()} hits, showing ${results.length}\n`);
  results.forEach((r, i) => {
    const oa = r.isOpenAccess ? ' · full text' : '';
    console.log(`${String(i + 1).padStart(2)}. [${r.evidence} · cited ${r.citedByCount}${oa}] ${r.year ?? ''}`);
    console.log(`    ${r.rawTitle}`);
    console.log(`    ${r.journal ?? ''}`);
    console.log(`    ${r.citation.url}   → strength: "${r.strength}"`);
    console.log('');
  });
  console.log('Add --json to emit copy-paste Citation objects for content/items/*.json.\n');
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
