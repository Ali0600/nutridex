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

## Citations — keep them real and matched

- **The citation must support the specific claim.** Don't cite a vitamin-A fact sheet for a fiber
  claim. If you can't find a source for a benefit, cut the benefit.
- **Preferred sources**, in order:
  1. A specific human study or meta-analysis on **PubMed** (`https://pubmed.ncbi.nlm.nih.gov/<pmid>/`)
     or **PMC** — set `pmid` when you have it.
  2. An authoritative reference for nutrient-driven claims — the **NIH Office of Dietary
     Supplements** Health Professional fact sheets
     (`https://ods.od.nih.gov/factsheets/<Nutrient>-HealthProfessional/`), source `other`.
- **Verify the PMID resolves** before committing — a made-up id is worse than no citation.
- Match `strength` to the evidence: `strong` (meta-analyses / strong consensus),
  `moderate` (some RCTs), `preliminary` (early or mechanistic only).

## Add a blog post

1. Create `src/app/blog/<slug>/page.mdx` (it becomes the route `/blog/<slug>`).
2. `export const metadata` for the page title/description, then `<BlogSchema slug="<slug>" />`
   at the top for the dateline + BlogPosting JSON-LD.
3. Add the matching entry to `BLOG_POSTS` in [`src/lib/blog.ts`](../src/lib/blog.ts) — it drives the
   `/blog` list and the sitemap.

## Add a nutrient (ranking page)

Add the nutrient to `NUTRIENTS` in [`src/lib/nutrients-config.ts`](../src/lib/nutrients-config.ts)
with its USDA `nutrient_nbr`, then re-run `npm run usda:import`. A `/nutrients/<key>` page and an
API route appear automatically.
