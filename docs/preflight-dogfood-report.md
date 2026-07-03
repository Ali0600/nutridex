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

### T6 — the GitHub Action's first cross-repo run (PR #1, 2026-07-03)

**Wins:**
- `uses: Ali0600/preflight/packages/action@main` (cross-repo, subdirectory action)
  resolved with zero workarounds and ran in 15s.
- The sticky PR comment rendered every direct dep with verdict/license, and the SARIF
  upload lit up the repo's Security tab on the first try.

**Headline finding — the Action and the CLI disagree on the same commit + policy:**
the local CLI exits 1 with 5 policy violations (T4); the Action **passes**. Its comment
even *mentions* the transitive CVE ("🔎 1 transitive dependency in the tree carry known
CVEs: `postcss@8.4.31`") but still concludes "✅ No new CVEs introduced" — in a PR where
every dependency, including that one, is newly introduced. The install-script policy
violations don't appear at all. So in PR mode the gate evaluates **direct diffed deps
only**, with transitive findings demoted to an informational line, and (apparently)
`policy-file` rules not applied to the transitive tree. The CI gate — the one that
actually protects `main` — is strictly weaker than the local CLI. This is the classic
"gated one path, left the sibling open" hole and the most valuable finding of the test.

**Nits:** comment grammar ("1 transitive dependency … carry known CVEs"); the action
targets Node 20, which GitHub Actions has deprecated (runners force Node 24 with a
warning) — bump `runs.using` to node24.

**Policy consequence:** since the Action doesn't enforce the strict rules and the CLI has
no allowlist, a permanently-red local gate would just train us to ignore it. Tuned
`preflight.config.json` to the enforceable subset — `vuln: "kev"`, `installScript: false`
(same concessions Preflight's own repo makes), keeping `suspiciousName`, `license`,
`minHealth`, `runtime`. The weekly `mode: repo` scan + Dependabot remain the net for
post-merge CVEs like the vendored postcss.

### T7 — content-phase PRs (PRs #6–#9, 2026-07-03)

Four more PRs (data layer, pages/API/quiz, content batch, OG images) each triggered the
Action. **Zero new dependencies across all four**, and the Action correctly reported nothing
to flag and stayed green every time — no false alarms on pure app/content changes. This is the
happy path the gate is meant to guard, and it behaved: it's quiet when it should be quiet.

## What it caught

- **A real transitive CVE, keyless:** `postcss@8.4.31` (GHSA-qx2v-qp2m-jg93) vendored inside
  `next@16.2.10` — found independently of and identically to `npm audit`, with no API key (T4).
- **The Next.js lockstep set**, correctly, at design time — and generated a `dependabot.yml`
  that ignores it with the right upgrade command, closing the exact "auto-updater breaks the
  framework" hole Preflight exists to prevent (T1).
- **Current, runtime-safe versions** for a 20-package greenfield stack in one command, all
  confirmed installable on Node 22 (T1–T3).

## False positives

- **`react`/`react-dom` labeled "coordinated by Expo"** in an explicitly `--framework next.js`
  plan (BUG-1) — wrong framework, and it leaves React out of the generated dependabot ignores.
- **4 install-script "violations"** (`esbuild`, `fsevents`, `sharp`, `unrs-resolver`) that are
  all legitimate native-binary packages in a normal Next.js tree — actionable only by turning
  the whole check off, since there's no allowlist (T4).
- No typosquat/suspicious-name or license false positives fired — that side was clean.

## UX friction

- **CLI vs Action disagree** on the same commit + policy (BUG-3) — the most important friction:
  the thing gating `main` is weaker than the local CLI, and says "No new CVEs" when the PR adds
  a CVE-carrying lockfile.
- **`--dev` swallowed only one package** (BUG-2), silently putting 9 dev tools in `dependencies`.
- **No lockfile → silent direct-only scan** (T3) with no note that coverage changed.
- **`plan` recommended an internally incompatible set** (eslint 10 × eslint-config-next 16, T5).
- Exit-code hygiene: piping `check` into `grep`/`tail` masks its exit 1 — must run unpiped to
  gate (a general shell gotcha, but worth a note in Preflight's docs).

## Missing features / bugs to file

- [ ] BUG-1: lockstep attribution ignores `--framework`; react/react-dom reported as Expo-coordinated in a Next.js plan (and absent from the generated dependabot ignores). Reproduces in `check` too.
- [ ] BUG-2: `plan --dev` only applies to the single following argument.
- [ ] FEAT: `plan` could emit a `github-actions` ecosystem block in `dependabot.yml`.
- [ ] FEAT: policy allowlist / per-advisory ignore — without it, `installScript: true` and unactionable vendored CVEs make the gate permanently red on real Next.js trees (T4).
- [ ] UX: `check` without a lockfile should say it's scanning direct deps only (T3 vs T4).
- [ ] IDEA: `plan` can recommend an internally incompatible set (eslint 10 × eslint-config-next 16, T5); consider a known-bad-combos list or framework-blessed toolchain versions.
- [ ] BUG-3 (headline): Action PR mode passes what the CLI fails — transitive CVEs newly introduced by the PR are informational-only and `policy-file` rules aren't applied to the transitive tree; "No new CVEs introduced" is wrong when the PR adds the whole lockfile (T6).
- [ ] NIT: sticky-comment grammar "1 transitive dependency … carry known CVEs" (T6).
- [ ] CHORE: action `runs.using: node20` is deprecated on GitHub runners — move to node24 (T6).

## Verdict

**Would I keep it on? Yes for `plan`, yes for the CI comment — but not yet as the sole gate.**

The single most useful moment was the very first: `preflight plan --framework next.js` chose a
current, Node-22-safe dependency set *and* generated the lockstep-aware `dependabot.yml` in one
command, before a single `npm install`. That's a genuinely better greenfield start than picking
versions by hand and hoping Dependabot doesn't break the framework later. The design-phase idea
is the product's strongest feature and it delivered.

As an **informational PR comment**, the Action is also a keeper — it resolved cross-repo with
zero config, rendered a clean per-dependency verdict table, populated the Security tab via SARIF,
and stayed correctly quiet across four dependency-free PRs. For a solo dev it's a nice always-on
second opinion.

Where it falls short is as a **hard gate you trust blindly**: the Action's PR mode is weaker than
its own CLI (BUG-3) — it demoted a real, newly-introduced transitive CVE to an informational line
and still printed "No new CVEs introduced." And the strict policy is unusable in practice because
`installScript: true` fires on every native binary in a normal Next.js tree with no allowlist to
adjudicate them. Both are fixable, and both are the difference between "useful advisor" and
"thing that guards `main`."

Net: Preflight earned its place in this project. The bugs it surfaced are exactly the kind a real
build finds and a synthetic test wouldn't — which is the whole point of dogfooding. Filed issues:

- BUG-1 — [lockstep attribution ignores `--framework`](https://github.com/Ali0600/preflight/issues/18) (react/react-dom → "Expo" in a Next plan; missing from generated dependabot ignores)
- BUG-2 — [`plan --dev` applies to only the next argument](https://github.com/Ali0600/preflight/issues/19)
- BUG-3 — [Action PR mode passes what the CLI fails](https://github.com/Ali0600/preflight/issues/20) (transitive/policy findings not gated; "No new CVEs" is wrong)
- FEAT — [policy allowlist / per-advisory ignore](https://github.com/Ali0600/preflight/issues/21) (so `installScript`/vendored-CVE rules are usable on real trees)
- FEAT — [`plan` emits a `github-actions` ecosystem block](https://github.com/Ali0600/preflight/issues/22)
- UX — [`check` should note "direct deps only" when no lockfile is present](https://github.com/Ali0600/preflight/issues/23)
- CHORE — [action `runs.using: node20` is deprecated](https://github.com/Ali0600/preflight/issues/24) → node24
