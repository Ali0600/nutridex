# NutriDex 🥝

> Every food, explained — a science-backed nutrition database of teas, fruits, vegetables,
> meats, and nuts, with the mechanism behind each benefit and the studies to back it up.

**Status: under construction.**

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

## Disclaimer

NutriDex is general education, not medical advice. Talk to a clinician before changing
your diet, especially if you take medication or manage a health condition.
