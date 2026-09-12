# NutriDex 🥝

> Every food, explained. A nutrition database of teas, fruits, vegetables, meats, nuts,
> seeds, legumes, grains, and spices. Each benefit comes with the science behind it and
> the studies that back it up.

[![CI](https://github.com/Ali0600/nutridex/actions/workflows/ci.yml/badge.svg)](https://github.com/Ali0600/nutridex/actions/workflows/ci.yml)
[![Preflight](https://github.com/Ali0600/nutridex/actions/workflows/preflight.yml/badge.svg)](https://github.com/Ali0600/nutridex/actions/workflows/preflight.yml)

**Live:** [nutridex-neon.vercel.app](https://nutridex-neon.vercel.app) · deploys from `main` once CI is green.

## What it does

43 foods in 10 categories, 18 compounds, 16 nutrients. Every claim has a citation.

- **Every citation is machine-checked** — all 83 cited PMIDs (PubMed ids) are looked up on
  Europe PMC. CI checks each one's title, year, first author and retraction status against a
  committed cache, so the build never touches the network. If an id points at a different paper,
  the build fails.
- **Benefit database** — each food explains its benefits with the actual science
  (beetroot → dietary nitrates → nitric oxide → lower blood pressure), surprising facts
  (kiwi contains serotonin), and linked studies. No uncited claims.
- **Compounds, ranked by how rare they are** — the active compounds behind the benefits live at
  `/compounds`. They range from **signature** (oleocanthal is found almost only in extra-virgin
  olive oil) to **common** (ALA is everywhere). Each has a cited note on where it occurs and which
  foods have it.
- **"If you overdo it"** — every food says what you would actually *notice* from too much: orange
  palms from sweet potato, red urine from beetroot, garlicky breath from Brazil nuts. Any claim of
  harm is cited. Where there is no real ceiling, it says so plainly. Portions that reach an adult's
  daily upper limit are computed from the USDA data (~21 g of Brazil nut = a day's selenium).
- **Browse by anything** — index pages for [categories](https://nutridex-neon.vercel.app/categories),
  [body parts](https://nutridex-neon.vercel.app/organs),
  [goals](https://nutridex-neon.vercel.app/goals),
  [nutrients](https://nutridex-neon.vercel.app/nutrients) and
  [compounds](https://nutridex-neon.vercel.app/compounds), each with live counts.
- **Nutrient rankings** — which foods actually give you the most vitamin C, iron, selenium…
  Computed from USDA FoodData Central data, not guesswork.
- **Super Foods** (and **Super Fruits**) — the standouts, and why they earn the label.
- **Search & compare** — full-text search at `/items?q=` and a side-by-side food comparison at
  `/compare` (benefits + per-100g nutrients).
- **Symptom & deficiency quiz** — pick what you are dealing with (including low vitamin D / B12 /
  magnesium), answer a few symptom questions, and get the foods most likely to help.
- **Blog** — SEO articles with citations and clearly marked affiliate slots. A **daily
  auto-blog research routine** keeps it growing (see [docs/auto-blog.md](docs/auto-blog.md)).

A JSON API (`/api/v1`) serves the same data for a future iOS app.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · MDX · zod ·
content-in-git (the database is plain JSON you can review, checked in CI) · Vercel.

Every dependency in this repo is checked with [Preflight](https://github.com/Ali0600/preflight)
before it goes in. See [docs/preflight-dogfood-report.md](docs/preflight-dogfood-report.md) for an
honest field report on using it to build this site.

## Development

```bash
npm install
npm run dev              # http://localhost:3000
npm run build            # production build
npm run lint             # eslint
npm run typecheck        # tsc --noEmit
npm test                 # vitest unit + API-contract tests
npm run test:e2e         # Playwright E2E (search, quiz, compare) against a prod build
npm run content:validate # zod-validate all content + verify citations offline (also runs in CI)
npm run citations:verify -- --write   # re-resolve every cited PMID against Europe PMC
npm run usda:import      # regenerate nutrients from bulk USDA CSVs (keyless)
npm run usda:enrich      # regenerate nutrients from the USDA API (needs FDC_API_KEY in .env.local)
npm run research -- kiwi sleep   # find citation-ready studies (keyless, Europe PMC)
npm run blog:research    # daily auto-blog brief: fresh studies + coverage gaps
```

Analytics uses `@vercel/analytics` + `@vercel/speed-insights`. Enable both in the Vercel dashboard.

## Disclaimer

NutriDex is general education, not medical advice. Talk to a clinician before changing
your diet, especially if you take medication or manage a health condition.

## Experience Gained

- Built a content-in-git nutrition site on **Next.js 16 (App Router) + React 19 + TypeScript**: zod-checked JSON/MDX
  served as static pages, a versioned **JSON API** (`/api/v1`) for a future iOS app, and a backend-free symptom quiz scored in pure TypeScript (Vitest-tested).
- Checked all **147 citations** against the Europe PMC API, fixed 1 id that pointed at an unrelated paper plus **16 fabricated
  author attributions**, then locked it in with an offline CI gate (committed cache) and a scheduled retraction re-check, each proven to fail on bad input.
- Made the content model police itself: `content:validate` fails the build on 3 kinds of error (uncited claim, dangling tag,
  missing safety section), and a `ulScope` type discriminator makes a wrong retinol-limit warning on beta-carotene foods impossible to express.
- Built 2 keyless data pipelines: per-100g nutrients from **USDA FoodData Central** for the ranking pages, and a Europe PMC
  research tool (ranks studies by evidence level) feeding a weekly agent that drafts cited blog posts as review PRs ([docs/auto-blog.md](docs/auto-blog.md)).
- Applied SEO and monetization end to end: per-route metadata, dynamic sitemap and robots, schema.org JSON-LD per page type,
  per-item OpenGraph images, and 1 env-overridable affiliate link builder with a site-wide FTC disclosure page and `rel="sponsored nofollow"` links.
- Stood up CI/CD with branch-protection gating (5 checks per PR: lint, typecheck, content validation, tests, build; a security
  Action plus weekly re-scan; Vercel deploys only green commits) and dogfooded that scanner, filing 7 upstream issues ([report](docs/preflight-dogfood-report.md)).
- Hardened delivery: an uptime monitor pings `/api/v1/health` every 15 minutes and auto-files/closes an outage issue, Lighthouse CI
  hard-gates accessibility and SEO on every PR, Playwright covers 3 critical journeys (search, quiz, compare), and Vitest contract-tests the API.
