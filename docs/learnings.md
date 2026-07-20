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
**Sharpened (compounds/cautions work):** don't just verify the abstract — never *write* a PMID from
memory at all. Recalled ids in this repo ran at roughly a **0% hit rate**: 4/4 wrong in one batch,
5/5 in another (9713058 turned out to be an orbital-cellulitis paper cited for lutein; 24390893 a
pregnancy-nausea meta-analysis cited for ginger's GI effects). Search by title → read the abstract →
paste the id → verify with `EXT_ID:<pmid>`. A wrong citation is worse than no citation, because it
looks verified. And if no source supports the claim, **drop the claim** — don't substitute a paper
that measures something adjacent (an effects paper is not a distribution paper).

## Two test runners in one repo need non-overlapping file globs

Vitest and Playwright both default to picking up `*.test.*` / `*.spec.*` files. When the E2E specs
(`e2e/*.spec.ts`) were added, `npm test` (vitest) would have tried to run them as unit tests — and
they import `@playwright/test`, which only works under the Playwright runner. Fixed by scoping vitest
to `include: ['src/**/*.test.ts']` in `vitest.config.ts`; Playwright's `testDir: './e2e'` keeps it to
the E2E folder. Convention here: **unit = `src/**/*.test.ts` (vitest), E2E = `e2e/**/*.spec.ts`
(Playwright)**.
**Why it came up:** adding Playwright E2E alongside the existing vitest suite (Phase 5).
**Takeaway:** when a repo has two test runners, give each an explicit, disjoint file glob — don't rely
on defaults, or one runner will try to execute the other's tests.

## Lighthouse CI: gate hard on deterministic categories, warn on flaky ones

The Lighthouse budget (`lighthouserc.json`) sets **accessibility and SEO as `error`** (hard-fail
≥0.9) but **performance and best-practices as `warn`**. Performance scores swing on shared CI runners,
and best-practices dings the Vercel analytics scripts that no-op when the build runs off-Vercel — so
gating hard on those would produce flaky red checks unrelated to real regressions. a11y and SEO are
deterministic and are the site's actual investment, so they're worth failing on.
**Why it came up:** wiring `treosh/lighthouse-ci-action` into CI (Phase 5) without making it a flaky gate.
**Takeaway:** in a CI quality gate, hard-fail only on signals that are stable and meaningful in that
environment; make environment-sensitive metrics advisory (`warn`) so the gate stays trustworthy.

## A test harness that binds a fixed port collides with other local apps

The Playwright `webServer` initially hardcoded port 3000; running it locally failed with `EADDRINUSE`
because a *different* project (the Preflight dashboard) was already serving on 3000. Playwright's
`reuseExistingServer` doesn't help — it only reuses a server that answers *your* health URL, not an
unrelated app squatting the port. Fixed by reading `PORT` from the env (`Number(process.env.PORT ?? 3000)`)
so a local run can pick a free port while CI keeps 3000.
**Why it came up:** verifying the E2E suite locally while another dev server was running (Phase 5).
**Takeaway:** make a dev/test harness's port configurable (env or auto-pick a free one) instead of
hardcoding — and don't `kill` a process on a "busy" port until you've confirmed it's actually yours.

## Encode a domain constraint as a type discriminator, not a code comment

Nutrient upper limits (ULs) look uniform but aren't: selenium's 400 µg counts *all* intake including
food, magnesium's 350 mg counts **supplements only**, and vitamin A's 3000 µg counts **preformed
retinol only** — while USDA reports vitamin A as RAE, which merges retinol with carotenoids. Naively
computing "grams of food that reach the UL" would have told readers that sweet potato and kale
approach vitamin-A toxicity. Beta-carotene doesn't cause it; the claim is flatly wrong. The fix
wasn't a comment saying "careful with vitamin A" — it was a field: `ulScope: 'total' |
'supplemental-only' | 'preformed-only'`, with `ulPortions()` reading **only** `total`. A future
contributor who adds magnesium's UL gets nothing rendered rather than a wrong warning.
**Why it came up:** building the "If you overdo it" feature, where the computed portion line is the
most authoritative-looking thing on the page and therefore the most damaging if wrong.
**Takeaway:** when a value's *validity* depends on context the code can't see, put the context in
the type next to the value and make the consumer filter on it. A comment documents the trap; a
discriminator makes falling into it unrepresentable.

## An optional field can't distinguish "safe" from "not researched"

Every food had to answer "what if I have too much?" — but making `cautions` optional would mean an
absent section reads as *either* "we checked, there's no real ceiling" or "nobody looked at this
yet". Those are opposite messages to a reader deciding whether to trust the page. So the CI gate
requires **≥1 caution per item**, with an explicit `severity: 'none'` value for "no real ceiling",
and the citation rule bends to match: anything above `none` needs a source (it claims harm), while
`none` is exempt (forcing a citation for "no documented ceiling" would push authors to invent one).
**Why it came up:** deciding coverage for the cautions feature — the choice between covering 15
risky foods and covering all 43.
**Takeaway:** when silence is ambiguous between two opposite meanings, don't allow silence. Make the
field mandatory and give the benign case its own explicit value — then the *absence of data* becomes
a build failure rather than a message you didn't intend to send.

## Keep an authored claim and a derived statistic in separate fields

A compound's `rarity` ("essentially only in extra-virgin olive oil") is a claim about the **real
world** and carries a citation, exactly like a health benefit. The "found in N of our 43 foods"
number is **derived** from this database. Conflating them would be a lie the size of the database:
astaxanthin appears in 1 item here, but rendering that as "unique to salmon" ignores krill, shrimp,
and the algae and yeasts that actually make it. So rarity is authored + cited, the count is computed
at render time, and the UI never presents the count as a statement about the world.
**Why it came up:** designing `content/compounds.json`, where the whole feature is "how rare is
this?" and the tempting shortcut is to compute rarity from our own item count.
**Takeaway:** a statistic about your dataset is not a fact about reality. Where a UI could be read
as claiming the latter, keep the two in separate fields with separate evidence rules — and make the
sample size visible so the derived number can't masquerade as a general truth.
