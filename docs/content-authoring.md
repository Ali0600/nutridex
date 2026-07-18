# Authoring NutriDex content

The database is **content-in-git**: every food is a JSON file validated in CI. This guide is
for whoever (human or an AI session) adds entries. The golden rule: **no claim without a study.**

## Add a food

1. Create `content/items/<category>/<slug>.json` where `<category>` is one of
   `tea | fruits | vegetables | meats | nuts` and `<slug>` is kebab-case and **equals the
   filename** (e.g. `green-tea.json` → `"slug": "green-tea"`).
2. Fill the fields (schema: [`src/lib/schema.ts`](../src/lib/schema.ts)):

   | field | notes |
   | --- | --- |
   | `name`, `summary` | human name; one–two sentence hook |
   | `category` | must match the folder |
   | `superfood` | if `true`, `superfoodReason` is **required** |
   | `fdcId` | optional; USDA FoodData Central id. If set, add it to `data/usda/fdc-map.json` and run `npm run usda:import` so a nutrient panel + rankings appear |
   | `benefits[]` | ≥1. Each needs `claim`, `mechanism` (the *why* — the actual biology), `organs[]`, `conditions[]`, `strength`, and `citations[]` (**≥1**) |
   | `surprisingFacts[]` | optional "did you know" items, each with an optional citation |
   | `affiliateSlots[]` | optional sponsor/affiliate links; `disclosure` is `affiliate` or `sponsored` and renders the FTC notice |
   | `updatedAt` | ISO date |

3. **Tags must exist.** `organs[]` values must be ids in [`content/organs.json`]; `conditions[]`
   values must be ids in [`content/conditions.json`]. CI fails on an unknown tag.
4. Run `npm run content:validate` locally — it must pass.
5. Open a PR. `ci` (which runs `content:validate`) and `preflight` must be green before merge.

## Finding research — `npm run research`

Don't cite from memory. `scripts/research.ts` queries **Europe PMC** (europepmc.org) — a free,
**keyless** index of PubMed + PMC + preprints — and returns citation-ready studies. This is how
you source both **database citations** and **blog topics**, and every result is a real, indexed
paper (no hallucinated PMIDs).

```bash
npm run research -- kiwi sleep                     # a food + a benefit/topic
npm run research -- "green tea" cholesterol --type meta   # only meta-analyses / systematic reviews
npm run research -- beetroot "blood pressure" --recent    # last 3 years (for fresh blog angles)
npm run research -- broccoli lung --json           # copy-paste Citation objects for the JSON
```

- **Always pair a food with a topic** (`kiwi sleep`, not just `kiwi`) — a bare food name pulls in
  agriculture/plant-science noise, since Europe PMC also indexes those.
- `--type meta|review|rct` filters by evidence level; results are otherwise ranked meta-analysis →
  systematic review → RCT → review → study, then by citation count.
- Each result prints a **suggested `strength`** (meta/systematic → strong, RCT/review → moderate,
  else preliminary) to drop straight into the schema, and `--json` emits ready-made `Citation`
  objects. Preprints are excluded by default (`--include-preprints` to see them).
- Still confirm the study actually supports the specific claim (read the abstract) before pasting —
  the tool finds candidates, it doesn't adjudicate them.

A weekly **scheduled routine** automates this for the blog — `npm run blog:research` builds a brief
of fresh, un-cited studies + coverage gaps, and a Claude Code session drafts a post as a review PR.
See [auto-blog.md](auto-blog.md).

## Citations — keep them real and matched

- **The citation must support the specific claim.** Don't cite a vitamin-A fact sheet for a fiber
  claim. If you can't find a source for a benefit, cut the benefit.
- **Preferred sources**, in order:
  1. A specific human study or meta-analysis on **PubMed** (`https://pubmed.ncbi.nlm.nih.gov/<pmid>/`)
     or **PMC** — set `pmid` when you have it.
  2. An authoritative reference for nutrient-driven claims — the **NIH Office of Dietary
     Supplements** Health Professional fact sheets
     (`https://ods.od.nih.gov/factsheets/<Nutrient>-HealthProfessional/`), source `other`.
- **Never write a PMID from memory — always look it up.** Recalled ids are wrong far more often
  than they're right (in one session, 4 out of 4 checked were wrong: a paper on orbital cellulitis
  cited for lutein sources, a pregnancy-nausea meta-analysis cited for ginger's GI effects). Search
  by title, read the abstract, then cite. Verify every id before committing:

  ```bash
  curl -s "https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:<pmid>%20AND%20SRC:MED&resultType=core&format=json" \
    | python3 -c "import sys,json;d=json.load(sys.stdin)['resultList']['result'];print(d[0]['title'] if d else 'NOT FOUND')"
  ```

- **If no source supports the claim, drop the claim** — don't substitute a paper that measures
  something adjacent. An effects paper is not a distribution paper; a composition survey is not
  evidence of risk. (EGCG, hydroxytyrosol, rice arsenic and spinach oxalate were all left out on
  these grounds rather than mis-cited.)
- Match `strength` to the evidence: `strong` (meta-analyses / strong consensus),
  `moderate` (some RCTs), `preliminary` (early or mechanistic only).

## Compounds (`content/compounds.json`)

Bioactives a food **actually contains**, each with a cited real-world `rarity`
(`signature | rare | uncommon | common`).

- **Contains, not "does something with".** Vitamin C helps your body *build* collagen, so collagen
  is not a compound; avocado oil helps you *absorb* lycopene but contains none; ginger acts on
  serotonin *receptors* without containing serotonin; flax carries ALA which only partly *converts*
  to EPA/DHA. All correctly excluded.
- **Tag by biology, not by our prose.** Kale carries sulforaphane even though no entry mentioned it;
  walnut carries serotonin (~87 µg/g, ~6× a banana). Conversely the herbal "teas" (ginger,
  peppermint) are not *Camellia sinensis* and must not get tea-plant compounds.
- **Compounds ≠ nutrients.** Anything with a USDA `nutrient_nbr` belongs in `NUTRIENTS` instead —
  that's why selenium is a nutrient with a ranking page, not a compound.
- `rarity` describes the **wider food supply** and needs a citation. The "in N foods here" count is
  derived from this database and must never be rendered as world-rarity.

## Cautions — "If you overdo it"

Every item **must** carry at least one `cautions` entry; `content:validate` fails without one,
because an absent section is ambiguous between "safe" and "not researched".

- `effect` leads with **what you'd notice** (orange palms, red urine, garlicky breath), not mechanism.
- Anything above `severity: 'none'` needs a citation. `none` is exempt — it asserts no harm, so it
  must not be forced to invent a source.
- **Separate the food from the extract.** Brewed green tea and turmeric-the-spice are mild; the
  high-dose supplements are what the liver-injury literature describes. Conflating them misinforms
  in both directions.
- Prefer debunking to repeating folklore where the evidence supports it (soy and thyroid).

## Add a blog post

1. Create `src/app/blog/<slug>/page.mdx` (it becomes the route `/blog/<slug>`).
2. `export const metadata` for the page title/description, then `<BlogSchema slug="<slug>" />`
   at the top for the dateline + BlogPosting JSON-LD.
3. Add the matching entry to `BLOG_POSTS` in [`src/lib/blog.ts`](../src/lib/blog.ts) — it drives the
   `/blog` list and the sitemap.

## Add a nutrient (ranking page)

Add the nutrient to `NUTRIENTS` in [`src/lib/nutrients-config.ts`](../src/lib/nutrients-config.ts)
with its USDA `nutrient_nbr`, then re-run `npm run usda:import` (or `usda:enrich`). A
`/nutrients/<key>` page, an API route, sitemap entries and the item-page chip all appear
automatically — adding selenium was genuinely a one-line change.

**If you also add a `ul` (upper limit), set `ulScope` honestly — most ULs do not apply to food:**

| `ulScope` | Meaning | Computed into a portion? |
|---|---|---|
| `total` | Limit counts all intake including food (selenium, zinc, iron, calcium, vit C, vit D) | **Yes** |
| `supplemental-only` | Limit is for supplements/fortification (magnesium, vit E, B6, folic acid) | Never |
| `preformed-only` | Vitamin A — the UL is retinol, but USDA reports **RAE, which merges retinol with carotenoids** | Never |

`ulPortions()` in [`src/lib/limits.ts`](../src/lib/limits.ts) reads **only `total`**. Marking
vitamin A `total` would claim sweet potato and kale approach the limit — beta-carotene does not
cause vitamin-A toxicity. Liver's vitamin A is handled as an authored caution instead.

Note the regenerated data is **merged, not overwritten**, so a food whose USDA fetch fails keeps its
existing panel — but still diff `data/usda/nutrients.generated.json` before/after, since the script
rewrites the whole file.
