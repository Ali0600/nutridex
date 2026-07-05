/**
 * Auto-blog research brief — the deterministic legwork behind the weekly blog routine
 * (see docs/auto-blog.md). Keyless: pairs the site's foods with their conditions, finds
 * *fresh* high-evidence studies via Europe PMC (scripts/lib/epmc.ts), drops anything already
 * cited or already blogged, and reports where the database's coverage is thin or dated.
 *
 * Author-side only — never runs in CI/build. Output is a Markdown brief a Claude Code session
 * reads to write a new post; `--json` emits the structured form.
 *
 *   npm run blog:research               # Markdown brief
 *   npm run blog:research -- --json     # structured JSON
 *   npm run blog:research -- --max 6    # cap topics probed (default 8)
 */
import fs from 'node:fs';
import path from 'node:path';
import { getConditions, getItems } from '../src/lib/content';
import { getBlogPosts } from '../src/lib/blog';
import { searchEuropePmc, THIS_YEAR, type StudyResult } from './lib/epmc';

const ROOT = process.cwd();
const RECENT_SINCE = THIS_YEAR - 4; // "fresh" = last ~4 years
const DATED_BEFORE = THIS_YEAR - 6; // a food/condition whose newest citation predates this is "dated"

/** Clean search phrase per condition id (the label often has extra words). */
const CONDITION_TERMS: Record<string, string> = {
  'high-blood-pressure': 'blood pressure',
  'kidney-cleanse': 'kidney',
  'lung-detox': 'lung',
  'hair-loss': 'hair loss',
  'iron-deficiency': 'iron deficiency',
  'immune-support': 'immune',
  'skin-health': 'skin',
  'gut-health': 'digestion',
  'blood-sugar': 'glycemic',
  'brain-focus': 'cognition',
  'bone-health': 'bone',
  'eye-health': 'macular',
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Every PMID / citation URL already used across item entries and blog posts. */
function collectUsedStudies(): { pmids: Set<string>; urls: Set<string> } {
  const pmids = new Set<string>();
  const urls = new Set<string>();

  for (const item of getItems()) {
    for (const b of item.benefits) {
      for (const c of b.citations) {
        if (c.pmid) pmids.add(c.pmid);
        urls.add(c.url);
      }
    }
  }

  // Blog MDX prose: pull pubmed / PMC ids out of the links.
  const blogDir = path.join(ROOT, 'src', 'app', 'blog');
  if (fs.existsSync(blogDir)) {
    for (const slug of fs.readdirSync(blogDir)) {
      const file = path.join(blogDir, slug, 'page.mdx');
      if (!fs.existsSync(file)) continue;
      const text = fs.readFileSync(file, 'utf8');
      for (const m of text.matchAll(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/g)) pmids.add(m[1]);
      for (const m of text.matchAll(/(PMC\d+)/g)) urls.add(`https://pmc.ncbi.nlm.nih.gov/articles/${m[1]}/`);
    }
  }
  return { pmids, urls };
}

interface Candidate {
  foodSlug: string;
  foodName: string;
  category: string;
  conditionId: string;
  conditionLabel: string;
  term: string;
  keywords: string[]; // food name + aliases, lowercased — a study must mention one to be on-topic
}

/** Food×condition pairs from item benefits, minus pairs already blogged. */
function topicCandidates(): Candidate[] {
  const conditions = new Map(getConditions().map((c) => [c.id, c]));
  const blogged = getBlogPosts().map((p) => new Set(p.tags));

  const seen = new Set<string>();
  const out: Candidate[] = [];
  for (const item of getItems()) {
    const condIds = new Set(item.benefits.flatMap((b) => b.conditions));
    for (const conditionId of condIds) {
      const cond = conditions.get(conditionId);
      if (!cond) continue;
      // covered if a post is tagged with this condition AND this food (or its category)
      const covered = blogged.some(
        (tags) => tags.has(conditionId) && (tags.has(item.slug) || tags.has(item.category)),
      );
      if (covered) continue;
      const key = `${item.slug}:${conditionId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        foodSlug: item.slug,
        foodName: item.name,
        category: item.category,
        conditionId,
        conditionLabel: cond.label,
        term: CONDITION_TERMS[conditionId] ?? cond.label.split(/[\s&]/)[0].toLowerCase(),
        keywords: [item.name, ...item.aliases].map((s) => s.toLowerCase()),
      });
    }
  }
  return out;
}

/** Deterministic week-of-year rotation so different topics surface each run. */
function rotateByWeek<T>(arr: T[]): T[] {
  const start = new Date(THIS_YEAR, 0, 1).getTime();
  const week = Math.floor((Date.now() - start) / (7 * 24 * 3600 * 1000));
  const offset = arr.length ? week % arr.length : 0;
  return [...arr.slice(offset), ...arr.slice(0, offset)];
}

interface Opportunity {
  candidate: Candidate;
  studies: StudyResult[];
  score: number;
}

const EVIDENCE_SCORE: Record<string, number> = {
  'meta-analysis': 5,
  'systematic review': 4,
  RCT: 3,
  review: 2,
  study: 1,
};

function coverageReport(): string[] {
  const items = getItems();
  const lines: string[] = [];
  for (const cond of getConditions()) {
    const foods = items.filter((i) => i.benefits.some((b) => b.conditions.includes(cond.id)));
    const years = foods.flatMap((f) =>
      f.benefits.flatMap((b) => b.citations.map((c) => c.year).filter((y): y is number => !!y)),
    );
    const newest = years.length ? Math.max(...years) : undefined;
    const flags: string[] = [];
    if (foods.length < 2) flags.push('thin (<2 foods)');
    if (newest !== undefined && newest < DATED_BEFORE) flags.push(`dated (newest ${newest})`);
    lines.push(
      `- ${cond.label} (${cond.id}): ${foods.length} food(s), newest citation ${newest ?? 'n/a'}` +
        (flags.length ? `  ⚠️ ${flags.join(', ')}` : ''),
    );
  }
  return lines;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const asJson = argv.includes('--json');
  const maxIdx = argv.indexOf('--max');
  const maxProbe = maxIdx >= 0 ? Number(argv[maxIdx + 1]) || 8 : 8;

  const used = collectUsedStudies();
  const candidates = rotateByWeek(topicCandidates()).slice(0, maxProbe);

  const opportunities: Opportunity[] = [];
  for (const cand of candidates) {
    let studies: StudyResult[] = [];
    try {
      studies = await searchEuropePmc([cand.foodName, cand.term], {
        type: 'meta',
        since: RECENT_SINCE,
        sort: 'relevance', // rank by relevance+evidence, not just newest
        limit: 10,
      });
    } catch (e) {
      console.error(`  (search failed for ${cand.foodName} × ${cand.term}: ${(e as Error).message})`);
    }
    // keep only studies that (a) actually mention the food, (b) are fresh, (c) aren't already cited
    const fresh = studies.filter((s) => {
      const haystack = `${s.rawTitle} ${s.abstract ?? ''}`.toLowerCase();
      const onTopic = cand.keywords.some((k) => haystack.includes(k));
      const alreadyCited = (s.pmid && used.pmids.has(s.pmid)) || used.urls.has(s.citation.url);
      return onTopic && !alreadyCited;
    });
    if (fresh.length === 0) continue;
    const score = Math.max(...fresh.map((s) => (EVIDENCE_SCORE[s.evidence] ?? 0) + (s.year ?? 0) / 10000));
    opportunities.push({ candidate: cand, studies: fresh, score });
    await sleep(300); // be polite to Europe PMC
  }
  opportunities.sort((a, b) => b.score - a.score);

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          generatedAt: new Date().toISOString().slice(0, 10),
          opportunities: opportunities.map((o) => ({
            food: o.candidate.foodSlug,
            condition: o.candidate.conditionId,
            angle: `${o.candidate.foodName} for ${o.candidate.conditionLabel.toLowerCase()}`,
            studies: o.studies,
          })),
          coverage: coverageReport(),
        },
        null,
        2,
      ),
    );
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const out: string[] = [`# NutriDex blog research brief — ${today}`, ''];

  if (opportunities.length === 0) {
    out.push('No fresh, un-cited high-evidence studies surfaced for the probed topics this week.');
    out.push('Do **not** fabricate a post — file the coverage report below and stop.', '');
  } else {
    out.push('## Top opportunities (fresh meta-analyses/reviews, not yet blogged or cited)', '');
    opportunities.forEach((o, i) => {
      out.push(`### ${i + 1}. ${o.candidate.foodName} × ${o.candidate.conditionLabel}`);
      out.push(
        `Angle: how ${o.candidate.foodName} may help with ${o.candidate.conditionLabel.toLowerCase()} — link to /items/${o.candidate.foodSlug} and /goals/${o.candidate.conditionId}.`,
      );
      for (const s of o.studies.slice(0, 3)) {
        out.push(`- [${s.evidence} · ${s.year ?? '?'} · cited ${s.citedByCount}] ${s.citation.url}`);
        out.push(`  strength: "${s.strength}" · ${s.citation.title}`);
        if (s.abstract) out.push(`  abstract: ${s.abstract}`);
      }
      out.push('');
    });
  }

  out.push('## Coverage report (foods per condition · newest citation)', '', ...coverageReport(), '');
  console.log(out.join('\n'));
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
