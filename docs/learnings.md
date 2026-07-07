# Learnings — NutriDex

Teachable concepts that came up building this project.

## Content-in-git with schema validation as a CI gate

Structured content (JSON/MDX) committed to the repo, validated by a schema (zod) in CI, is a
lightweight alternative to a CMS/database for a mostly-read dataset. The schema encodes editorial
rules — here, "every benefit must cite ≥1 study" and "every tag must exist" — so a bad content PR
fails the build instead of shipping.
**Why it came up:** the nutrition database needed to be credible (no uncited claims) and reviewable,
without standing up a backend.
**Takeaway:** when content changes rarely and must be trustworthy, make the schema the gate — invalid
data shouldn't be representable in a merged commit.

## Static-first: pages and a JSON API from one source

Next.js App Router route handlers with `export const dynamic = 'force-static'` emit JSON at build
time, so the same committed content renders as HTML pages *and* as a keyless static API — no server,
no drift between the two. `generateStaticParams` prerenders every dynamic route.
**Why it came up:** the site needed a nice web UI now and a data feed for a future iOS app, from the
same data.
**Takeaway:** if data is build-time-known, a static API route is free — reuse the content loaders the
pages already use rather than exposing a live DB.

## Satori (next/og) requires explicit `display:flex` on multi-child elements

`next/og` renders JSX with Satori, which supports a subset of CSS: any element with more than one
child **must** declare `display: flex` (or `contents`/`none`), or the build throws. JSX like
`Foo{expr}` silently creates two children.
**Why it came up:** per-item OpenGraph images failed to prerender until the brand line was collapsed
to a single interpolated string.
**Takeaway:** in OG-image components, give every container an explicit `display`, and avoid
`text{interpolation}` — compute the string first.

## `useSyncExternalStore` for "read a browser-only value after hydration"

Reading `localStorage` in a `useEffect` and calling `setState` trips React 19's
`react-hooks/set-state-in-effect` rule and can flash during hydration. `useSyncExternalStore` with a
`getServerSnapshot` returning the SSR default reads the client value cleanly post-hydration.
**Why it came up:** the first-visit onboarding modal must not flash for returning visitors and must
not violate the lint gate.
**Takeaway:** for one-shot reads of browser-only state (localStorage, matchMedia), reach for
`useSyncExternalStore`, not an effect that setStates on mount.

## A CI gate is only as strong as its weakest trigger

Dogfooding the Preflight Action surfaced that its PR mode passed a transitive CVE that its own CLI
failed on — the gate protecting `main` was weaker than the local tool. Same lesson on the deploy
side: Vercel auto-deploys `main`, so branch protection (require `ci` + `preflight`, squash-only) is
what actually keeps un-green code from shipping.
**Why it came up:** the project both *used* a CI gate and *was a test of* one.
**Takeaway:** verify the gate you rely on actually fails on the thing you think it catches — don't
trust a green check or a passing comment without confirming what it evaluated.

## Verify a citation's abstract before using it — landmark trials can be retracted & re-published under a new ID

The research tool ranks Europe PMC hits, but the top hit for a broad query is often off-topic (a
Mediterranean-diet meta-analysis surfaced for "olive oil," a GLP-1 review for "hair loss"). Worse,
the famous PREDIMED olive-oil RCT was **retracted in 2013 and re-published in 2018 under a new PMID
(29897866)** — citing the original would cite a withdrawn paper. Every claim in an item's JSON is
schema-required to have a citation, but the schema can't check that the study *says what the claim
says*.
**Why it came up:** adding the Oils category, each benefit needed real primary evidence, and the
evidence bar in `docs/content-authoring.md` demands the citation actually support the claim.
**Takeaway:** for each PMID, pull its abstract (Europe PMC `resultType=core`) and confirm the
title, year, study type, and *direction of effect* before writing it into content — never cite from
a search-results title alone, and prefer the corrected/republished version of any landmark trial.
