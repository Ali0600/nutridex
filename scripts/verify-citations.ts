/**
 * `npm run citations:verify` — resolve every PMID cited in content against Europe PMC and
 * refresh `data/citations.verified.json`, the cache the offline CI gate asserts against.
 *
 * Networked, so it is NOT part of the PR gate (an external API in the merge path is a flaky
 * gate). Run it after adding citations, and on a schedule to catch retractions and errata
 * appearing on papers that were fine when they were cited.
 *
 *   npm run citations:verify           # check only; non-zero exit if anything is wrong
 *   npm run citations:verify -- --write  # also update the cache
 *
 * Never writes a record it could not resolve: a failed fetch must not be cached as "fine".
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  CACHE_PATH,
  type VerifiedCache,
  type VerifiedRecord,
  checkCitation,
  collectCitations,
  isGroupAuthor,
  readCache,
} from './lib/citations';

const EPMC = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search';
const BATCH = 15;
const WRITE = process.argv.includes('--write');

interface EpmcResult {
  pmid?: string;
  title?: string;
  authorString?: string;
  pubYear?: string;
  journalInfo?: { journal?: { medlineAbbreviation?: string; title?: string } };
  pubTypeList?: { pubType?: string[] | string };
  commentCorrectionList?: { commentCorrection?: { id?: string; type?: string }[] };
}

function pubTypes(r: EpmcResult): string[] {
  const pt = r.pubTypeList?.pubType;
  if (!pt) return [];
  return (Array.isArray(pt) ? pt : [pt]).map((s) => String(s).trim().toLowerCase());
}

/**
 * Exact match, not `includes('retract')`: "Retraction of Publication" marks a retraction
 * *notice*, which is a legitimate thing to cite. Only the retracted paper itself is a defect.
 */
function isRetracted(r: EpmcResult): boolean {
  return pubTypes(r).includes('retracted publication');
}

function errataOf(r: EpmcResult): string[] {
  const list = r.commentCorrectionList?.commentCorrection ?? [];
  return list.filter((c) => /erratum|correction/i.test(c.type ?? '')).map((c) => c.id ?? 'unknown');
}

async function fetchBatch(pmids: string[]): Promise<EpmcResult[]> {
  const query = `(${pmids.map((p) => `EXT_ID:${p}`).join(' OR ')}) AND SRC:MED`;
  const url = `${EPMC}?query=${encodeURIComponent(query)}&format=json&pageSize=100&resultType=core`;
  const res = await fetch(url, { headers: { 'User-Agent': 'NutriDex-citation-verify' } });
  if (!res.ok) throw new Error(`Europe PMC error ${res.status}`);
  const data = (await res.json()) as { resultList?: { result?: EpmcResult[] } };
  return data.resultList?.result ?? [];
}

async function main(): Promise<void> {
  const refs = collectCitations();
  const pmids = [...new Set(refs.map((r) => r.pmid))].sort();
  console.log(`Resolving ${pmids.length} unique PMIDs from ${refs.length} citations…`);

  const fresh: VerifiedCache = {};
  const checkedAt = new Date().toISOString().slice(0, 10);

  for (let i = 0; i < pmids.length; i += BATCH) {
    const chunk = pmids.slice(i, i + BATCH);
    const results = await fetchBatch(chunk);
    for (const r of results) {
      if (!r.pmid) continue;
      const journal = r.journalInfo?.journal?.medlineAbbreviation ?? r.journalInfo?.journal?.title ?? null;
      const rec: VerifiedRecord = {
        title: r.title?.replace(/\.$/, '') ?? '',
        firstAuthor: (r.authorString ?? '').split(',')[0]?.trim() ?? '',
        groupAuthor: isGroupAuthor(r.authorString ?? ''),
        journal: journal || null,
        year: r.pubYear ? Number(r.pubYear) : null,
        retracted: isRetracted(r),
        errata: errataOf(r),
        checkedAt,
      };
      fresh[r.pmid] = rec;
    }
    process.stdout.write(`  ${Object.keys(fresh).length}/${pmids.length}\r`);
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.log();

  const errors: string[] = [];
  const notes: string[] = [];

  // Unresolvable PMIDs are a hard error — but never overwrite a good cached record with a
  // gap caused by a transient outage.
  const previous = readCache();
  const merged: VerifiedCache = { ...previous };
  for (const p of pmids) {
    if (fresh[p]) merged[p] = fresh[p];
    else if (previous[p]) notes.push(`pmid ${p} did not resolve this run; keeping the cached record`);
    else errors.push(`pmid ${p} could not be resolved by Europe PMC at all`);
  }
  // Drop cache entries for citations no longer in content.
  for (const p of Object.keys(merged)) if (!pmids.includes(p)) delete merged[p];

  for (const ref of refs) {
    for (const problem of checkCitation(ref, merged[ref.pmid])) {
      errors.push(`${ref.where} (${ref.context}): ${problem}`);
    }
  }

  for (const p of pmids) {
    const rec = merged[p];
    if (rec?.errata.length) {
      notes.push(`pmid ${p} has an erratum on record (${rec.errata.join(', ')}) — confirm the claim still holds`);
    }
  }

  if (WRITE) {
    fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
    const ordered = Object.fromEntries(Object.keys(merged).sort().map((k) => [k, merged[k]]));
    fs.writeFileSync(CACHE_PATH, `${JSON.stringify(ordered, null, 2)}\n`);
    console.log(`Wrote ${CACHE_PATH} (${Object.keys(ordered).length} records)`);
  }

  for (const n of notes) console.warn(`⚠️  ${n}`);
  if (errors.length) {
    for (const e of errors) console.error(`❌ ${e}`);
    console.error(`\ncitations:verify — ${errors.length} problem(s)`);
    process.exit(1);
  }
  console.log(`✅ citations:verify — ${refs.length} citations, ${pmids.length} PMIDs, all resolve and match`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
