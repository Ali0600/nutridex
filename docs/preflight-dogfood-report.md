# Preflight dogfood report — the NutriDex build

NutriDex was built greenfield with **every dependency decision routed through
[Preflight](https://github.com/Ali0600/preflight)** — `preflight plan` before scaffolding,
`preflight check` before installs, the GitHub Action gating every PR, and the weekly
scheduled re-scan. This report logs each touchpoint honestly: what Preflight got right,
what it got wrong, and what's missing. Findings get filed as issues on the Preflight repo.

## Environment

| | |
| --- | --- |
| Preflight version | commit `62b65c3` (run from source via `npm run plan` / `npm run check`) |
| Project | NutriDex — Next.js 16 App Router, TypeScript, Node 22 |
| Node (dev machine) | v22.22.2 |
| Started | 2026-07-03 |

## Touchpoint log

### T1 — `preflight plan` for the initial dependency set (2026-07-03)

```
npm run plan -- --node 22 --framework next.js \
  next react react-dom zod @next/mdx @mdx-js/react @mdx-js/loader \
  --dev typescript @types/node @types/react @types/react-dom \
       eslint eslint-config-next prettier vitest tsx csv-parse
```

**Got right:**
- Recommended the current majors for all 17 packages (next 16.2.10, react 19.2.7,
  zod 4.4.3, eslint 10.6.0, typescript 6.0.3 …) — the lockstep registry **does** know
  Next 16, so it isn't stale.
- Correctly identified the Next.js lockstep set (`next`, `eslint-config-next`, `@next/*`)
  and generated a `dependabot.yml` that ignores it with the right upgrade command
  (`npx @next/codemod upgrade`).
- Confirmed every package installs on Node 22 (no caps needed) and emitted
  `engines.node: ">=22"`.

**Bugs found:**
- **BUG-1 — wrong framework attribution for react/react-dom.** With `--framework next.js`
  explicitly passed, `react` and `react-dom` were labeled *"coordinated by Expo — update
  via npx expo install"*. In a Next.js project that guidance is wrong (Expo isn't
  involved), and inconsistent: the summary footer lists the Next.js lockstep set without
  react/react-dom, while the per-package lines say Expo. Lockstep membership lookup seems
  to match the *first* framework containing a package rather than the declared one.
  Side effect: `react`/`react-dom` are **not** in the generated dependabot ignore list,
  so a future React major could be bumped independently of Next.
- **BUG-2 — `--dev` captures only the next argument.** Ten packages were passed after
  `--dev`, but only `typescript` landed in `devDependencies`; the other nine
  (`@types/*`, `eslint`, `eslint-config-next`, `prettier`, `vitest`, `tsx`, `csv-parse`)
  were emitted as regular `dependencies`. Either `--dev` should consume all following
  packages, be repeatable per package, or the docs should say it takes exactly one.
  Fixed the split by hand in the committed `package.json`.

**Feature gaps noted:**
- The generated `dependabot.yml` only covers the `npm` ecosystem — no `github-actions`
  entry, though every repo using the generated file will also have workflows (added by
  hand here).

**Verdict for this touchpoint:** genuinely useful — picked current, Node-22-safe versions
and produced correct lockstep guardrails in one command. The two bugs are real but
cosmetic-to-moderate; neither would have shipped a broken build.

### T2 — `preflight plan` for the Tailwind v4 set (2026-07-03)

```
npm run plan -- --node 22 tailwindcss @tailwindcss/postcss postcss
```

Clean: `tailwindcss@4.3.2`, `@tailwindcss/postcss@4.3.2`, `postcss@8.5.16`, all
Node-22-compatible, no CVEs, no caps. Versions adopted verbatim.

### T3 — `preflight check` before the first `npm install` (2026-07-03)

```
npm run check -- …/package.json --policy …/preflight.config.json
```

20 deps · 0 CVE · exit 0 · policy ok. License + OpenSSF-health lookups were auto-enabled
by the policy (as documented). BUG-1 reproduced here too: `react`/`react-dom` shown as
"Framework-pinned (Expo)" — so the wrong-framework attribution lives in the shared verdict
logic, not just in `plan`.

**UX note:** with no lockfile yet (pre-install), the scan silently covered direct deps
only. A one-line hint ("no lockfile found — direct dependencies only") would make the
coverage explicit; the difference turned out to matter a lot (see T4).

### T4 — re-check after install, lockfile present (2026-07-03)

Same command, now with `package-lock.json` on disk:

```
600 deps (20 direct · 580 transitive) · 1 CVE
✗ 5 policy violation(s) · exit 1
  · vuln: postcss@8.4.31 — 1 advisory · medium
  · install-script: esbuild@0.28.1 / fsevents@2.3.3 / sharp@0.34.5 / unrs-resolver@1.12.2
```

**What it caught (for real):** `next@16.2.10` vendors a nested `postcss@8.4.31` carrying
GHSA-qx2v-qp2m-jg93 (moderate XSS via unescaped `</style>`). Preflight's transitive scan
found exactly what `npm audit` found, independently, keyless. Genuine catch.

**Adjudication of the 5 violations:**
- `postcss@8.4.31` — real, but **unactionable by this repo**: Next pins its own nested
  copy; only a Next release fixes it. Practical risk to a static content site: low.
- 4 × `install-script` — all legitimate native-binary packages (esbuild via tsx/vitest,
  fsevents on macOS watchers, sharp via next image optimization, unrs-resolver via
  eslint-config-next). `installScript: true` is **effectively unusable against a real
  Next.js transitive tree** — there is no allowlist/exception mechanism. Telling:
  Preflight's own repo runs `installScript: false`.

**Feature gaps:** per-package policy allowlist (`"allow": ["esbuild", …]`) and/or
per-advisory ignore (à la Dependabot `ignore` / osv-scanner exceptions); without them the
strict gate is red forever on findings nobody can act on.

### T5 — `plan`'s recommended set was internally incompatible (2026-07-03)

`preflight plan` recommended `eslint@10.6.0` + `eslint-config-next@16.2.10`. ESLint 10
**crashes** with that config (`contextOrFilename.getFilename is not a function` — its
vendored `eslint-plugin-react` still uses an API ESLint 10 removed). The declared peer
range (`eslint >=9.0.0`) is wrong upstream, so Preflight can't see it in metadata — but
the lesson stands: **`plan` validates each package individually (runtime, CVE, license),
not that the set works together.** Possible mitigations: a known-bad-combo advisory list,
or preferring the framework's blessed toolchain versions (create-next-app ships
`eslint ^9`). Resolved by downgrading to `eslint@^9.39.4`.

<!-- T6+: CI Action on PRs · scheduled scan — appended as they happen -->

## What it caught

_(accumulating)_

## False positives

_(accumulating)_

## UX friction

_(accumulating)_

## Missing features / bugs to file

- [ ] BUG-1: lockstep attribution ignores `--framework`; react/react-dom reported as Expo-coordinated in a Next.js plan (and absent from the generated dependabot ignores). Reproduces in `check` too.
- [ ] BUG-2: `plan --dev` only applies to the single following argument.
- [ ] FEAT: `plan` could emit a `github-actions` ecosystem block in `dependabot.yml`.
- [ ] FEAT: policy allowlist / per-advisory ignore — without it, `installScript: true` and unactionable vendored CVEs make the gate permanently red on real Next.js trees (T4).
- [ ] UX: `check` without a lockfile should say it's scanning direct deps only (T3 vs T4).
- [ ] IDEA: `plan` can recommend an internally incompatible set (eslint 10 × eslint-config-next 16, T5); consider a known-bad-combos list or framework-blessed toolchain versions.

## Verdict

_(written at the end of the build)_
