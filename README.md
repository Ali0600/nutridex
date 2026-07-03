# NutriDex 🥝

> Every food, explained — a science-backed nutrition database of teas, fruits, vegetables,
> meats, and nuts, with the mechanism behind each benefit and the studies to back it up.

[![CI](https://github.com/Ali0600/nutridex/actions/workflows/ci.yml/badge.svg)](https://github.com/Ali0600/nutridex/actions/workflows/ci.yml)
[![Preflight](https://github.com/Ali0600/nutridex/actions/workflows/preflight.yml/badge.svg)](https://github.com/Ali0600/nutridex/actions/workflows/preflight.yml)

**Live:** [nutridex.vercel.app](https://nutridex.vercel.app) · deploys from `main` on green CI.

## What it will do

- **Benefit database** — each item documents its special benefits with the actual science
  (beetroot → dietary nitrates → nitric oxide → lower blood pressure), surprising facts
  (kiwi contains serotonin), and linked studies — never uncited claims.
- **Browse by body part or goal** — skin, kidney, lungs, hair… or conditions like high
  blood pressure, lung detox, hair loss.
- **Nutrient rankings** — which foods actually give you the most vitamin C, iron, potassium…
  computed from USDA FoodData Central data, not vibes.
- **Super Foods** — the standouts and why they earn the label.
- **Symptom quiz** — pick what you're dealing with, answer a few symptom questions, get
  matched to the foods most likely to help.
- **Blog** — SEO articles with citations and disclosed affiliate slots.

A JSON API (`/api/v1`) will serve the same dataset to a future iOS app.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · MDX · zod ·
content-in-git (the database is reviewable JSON, validated in CI) · Vercel.

Every dependency in this repo is pre-flighted with [Preflight](https://github.com/Ali0600/preflight)
— see [docs/preflight-dogfood-report.md](docs/preflight-dogfood-report.md) for the honest
field report of using it to build this site.

## Development

```bash
npm install
npm run dev              # http://localhost:3000
npm run build            # production build
npm run lint             # eslint
npm run typecheck        # tsc --noEmit
npm test                 # vitest
npm run content:validate # zod-validate all content (also runs in CI)
npm run usda:import      # regenerate data/usda/nutrients.generated.json
```

## Experience Gained

- Architected and shipped a **content-in-git nutrition platform** on **Next.js 16 (App Router,
  React 19) + TypeScript**, where a structured JSON/MDX database is the single source of truth,
  **schema-validated in CI with zod** and served both as fully static pages and a versioned
  **JSON API** (`/api/v1`, `force-static` + CORS) designed for a future iOS client.
- Built a **schema-enforced content model** with cross-file referential integrity (organ/condition
  tags, citation-per-claim, superfood justification) and a custom `content:validate` gate that
  fails the build on any uncited claim or dangling tag.
- Engineered a **keyless data-import pipeline** distilling per-100g nutrient values from **USDA
  FoodData Central** into committed JSON that powers build-time vitamin-ranking pages — no API key
  in CI or runtime.
- Implemented a **data-driven, backend-free recommendation quiz** (pure scoring in TypeScript,
  unit-tested with Vitest) mapping user-reported symptoms → conditions → tagged foods.
- Stood up a **CI/CD pipeline with branch-protection merge-gating**: lint · typecheck ·
  content-validation · tests · build on every PR, plus a **third-party security Action** gating
  dependency changes and a **scheduled weekly re-scan** — with production deploys (Vercel) wired to
  only ever build already-green commits.
- Applied **SEO/structured-data engineering** end to end: per-route metadata, dynamic sitemap &
  robots, schema.org JSON-LD per page type, and dynamically-generated per-item OpenGraph images.
- **Dogfooded a supply-chain scanner** (Preflight) across the whole build and produced an
  evidence-based [usefulness report](docs/preflight-dogfood-report.md), filing 7 upstream issues
  (including a gate-correctness bug where the CI Action passed a CVE the CLI failed on).

## Disclaimer

NutriDex is general education, not medical advice. Talk to a clinician before changing
your diet, especially if you take medication or manage a health condition.
