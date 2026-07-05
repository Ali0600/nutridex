# Automated weekly blog research

The blog grows itself with a **weekly scheduled Claude Code routine** — no API key, no separate
service. Each week a fresh Claude Code session gathers new research, drafts a post, and opens a
**draft PR** for you to review and merge. Nothing publishes unreviewed.

## The pieces

- **`npm run blog:research`** ([scripts/blog-research.ts](../scripts/blog-research.ts)) — the
  keyless legwork. It pairs the site's foods with their conditions, finds *fresh* meta-analyses via
  Europe PMC ([scripts/lib/epmc.ts](../scripts/lib/epmc.ts)), and produces a **brief**:
  - **Dedup** — drops any study already cited (in `content/items/*.json` or a blog post) and any
    food×condition pair already blogged, so it never repeats itself.
  - **On-topic guard** — a study must actually mention the food (name/alias) to be suggested,
    ranked by evidence level and relevance.
  - **Coverage report** — foods per condition + newest citation year, flagging thin/dated topics.
  - `--json` for the structured form; `--max <n>` caps how many topics it probes (default 8).
- **The routine** — a scheduled task at `~/.claude/scheduled-tasks/weekly-blog-research/SKILL.md`
  (created with the `schedule` skill). It reads the brief, writes one post, and opens the PR.

## What the routine does each run

1. `cd` into the repo, `git pull` main, verify `gh auth`.
2. `npm run blog:research` and read the brief.
3. If nothing fresh surfaced → **it does not fabricate a post.** It files the coverage report and
   stops (the no-op is announced, never silent).
4. Otherwise it picks the best opportunity, **writes the post from the real abstracts** in the
   brief, following [docs/content-authoring.md](content-authoring.md): MDX at
   `src/app/blog/<slug>/page.mdx` + a `BLOG_POSTS` entry in `src/lib/blog.ts`, citing **only** the
   real PMIDs from the brief, linking to the relevant `/items/*` and `/goals/*` pages.
5. It may add **one** well-justified new citation to an existing food entry (clearly flagged).
6. Runs `npm run content:validate` + `npm run build` — never pushes red.
7. Opens a **draft PR** titled `Auto-blog: <title>` with the studies used, claims made, the
   coverage report, and the reviewer checklist below.

## Your reviewer checklist (before merging an auto-blog PR)

Auto-drafted medical content is **draft until you vet it** — branch protection means it can't merge
without you. Check:

- [ ] Every citation's study actually supports the claim it's attached to (open the PMID, read the
      abstract — don't trust the framing).
- [ ] The `strength` label is honest (meta-analysis → strong; single RCT → moderate; mechanistic →
      preliminary), and mixed evidence is described as mixed.
- [ ] No overstated or absolute health claims; the not-medical-advice framing holds.
- [ ] Links to `/items/*` and `/goals/*` resolve.

Merge = deploy (Vercel builds `main` on green), so merging is the publish action.

## Managing the routine

- **Pause / edit / reschedule:** ask Claude to update it (uses `update_scheduled_task`), or edit
  `~/.claude/scheduled-tasks/weekly-blog-research/SKILL.md` directly.
- **Run it now:** ask Claude to trigger the `weekly-blog-research` task.
- **Caveat:** the routine runs while the Claude app is open. If the app is closed when it's due
  (Monday), it runs on next launch — so it may land a bit late, but it won't silently skip a week.
