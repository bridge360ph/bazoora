# Git and GitHub workflow

How we branch, commit, and review on Bazoora. Every rule here exists because
breaking it has already cost this team real time. Where that is the case, the
incident is named so you can see it is not arbitrary.

If you read only one section, read [The short version](#the-short-version).

---

## The short version

1. Branch off `development`. Never off another person's feature branch.
2. Merge `development` into your branch at least every few days.
3. One feature per PR. If the title needs an "and", it is two PRs.
4. Commit in small, self-contained steps with `type(scope): description`.
5. Before asking for review: `pnpm build` and `pnpm lint` both pass, and you
   have read your own diff top to bottom.
6. Fill in the PR template honestly. The description must match the diff.
7. Add the `ready for review` label. Without it, nobody knows it is your turn
   to wait and ours to act.
8. Do not push while a review is in progress. Wait for the verdict.
9. When changes are requested, push fixes to the same branch and re-add
   `ready for review`.

---

## Branching

**Always branch from `development`.** It is the base branch for everything.
`main` is production and no feature PR ever targets it.

```bash
git checkout development
git pull
git checkout -b feat/short-description
```

Name branches `type/short-description`, matching the commit types below:
`feat/route-assignment`, `fix/marker-bearing`, `chore/render-blueprint`.

**Keep your branch close to `development`.** Merge it in regularly:

```bash
git fetch origin
git merge origin/development
```

A branch that sits for weeks stops being mergeable. We closed three PRs in
this repo for exactly this reason. One of them, #64, had drifted so far that
merging `development` produced 24 conflicts, 14 of which were the same file
created independently on both sides. The work in it was good. It still could
not land, and it had to be re-cut by hand onto a fresh branch.

**Do not branch off another open PR.** If your work truly depends on someone
else's unmerged work, say so explicitly in your PR description ("Depends on
#123, merge that first") and expect to rebase once it lands.

This matters more here than in most repos, because **we squash-merge**. When a
parent PR is squashed, its individual commits stop existing, so your branch and
`development` no longer share history and git can no longer tell that the
parent's work is already in. #37 and #79 were both stacked this way. When their
parents merged, both were left conflicting against work that was already
present, and #37 turned out to have been made entirely redundant without anyone
noticing.

---

## Commits

**One logical change per commit.** A reviewer should be able to read your
commits in order and follow your reasoning. If a commit needs "and" to
describe it, split it.

**Format:** `type(scope): description`, imperative mood, subject 50 characters
or under.

```
feat(api): add hauling request approval endpoint
fix(map): correct haversine argument order
chore(deps): bump brace-expansion to 2.1.4
refactor(route): extract eco-aide assignment into a hook
```

Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`, `perf`.
Scope is the area touched: `api`, `web`, `db`, `ui`, `auth`, `map`, and so on.

Use the body to explain **why**, not what. The diff already shows what. If a
change is subtle or the reasoning is not obvious from the code, that belongs in
the commit message where it survives.

**Never commit:**

- Secrets, API keys, tokens, `.env` files
- Tool output such as `lint.txt` or build logs
- Machine-specific config: personal ngrok hostnames, LAN IP addresses in
  `vite.config.ts`, absolute paths from your own machine
- Commented-out code you intend to restore later. That is what git is for.
- AI-attribution trailers of any kind

All five of those have arrived in a PR here at least once.

---

## Pull requests

**One feature per PR, and keep it small.** A reviewer's attention is finite,
and a 60-file PR gets a worse review than three 20-file PRs, not a better one.

The clearest failure of this was #77, titled "add Philippine address selector".
The selector itself was four files and was good. The PR was 44 files, because
the branch had also picked up an entire parallel authentication implementation
along the way. The title was accurate about the intent and wildly inaccurate
about the contents, and it took a full investigation to establish that.

**Do not include unrelated changes**, however small. If you notice something
else broken while you are in there, either fix it in its own PR or open an
issue. A fleet-management PR touching the login page will be questioned, and
should be.

**The description must match the diff.** This one is not negotiable. #37's
description said create, edit, suspend and deactivate were connected to the
backend. In the code, all four only mutated local React state, and the API
functions were never imported anywhere. Discovering that consumed a whole
review cycle that a truthful description would have saved.

Use the PR template. Delete the sections that do not apply rather than leaving
them blank. Fill in the testing steps as if writing for someone who has never
seen the feature, because your reviewer has not.

**Screenshots are required for any UI change.** A short screen recording is
better for anything involving interaction or animation.

---

## Labels and the review state machine

Labels tell everyone whose turn it is without opening the PR. Keep them
accurate.

```
ready for review  ->  review in progress  ->  requested changes
       ^                                              |
       |______________________________________________|
                    (you push fixes)
```

| Label | Meaning | Who sets it |
|---|---|---|
| `ready for review` | Waiting for a reviewer to pick it up | You, when you open the PR and each time you hand it back |
| `review in progress` | A reviewer is actively on it now | The reviewer |
| `requested changes` | The ball is with you, nobody else is working it | The reviewer |
| `ready to merge` | Approved but blocked on something else | The reviewer |
| `file conflicts` | Conflicts with `development` | Anyone who spots it |
| `needs-clarification` | Blocked on a question | Whoever is blocked |

**Add `ready for review` when you open the PR.** A PR with no label reads as
work in progress and will be skipped.

If you are blocked on a question, add `needs-clarification`, ask the question
in a PR comment, and say who you need it from. Do not sit on it silently. One
PR here sat as a draft for a month behind an unanswered scope question, and by
the time anyone looked, other work had overtaken it.

If your PR is not ready, open it as a **draft**.

---

## Review etiquette

**Self-review first.** Read your own diff on GitHub before adding the label.
You will catch the debug logging, the stray file and the half-finished thought
yourself, and it costs you five minutes instead of costing someone else a round
trip.

**Do not push while a review is in progress.** The reviewer is reading a
specific commit. New commits mid-review invalidate their line references and
whatever they have already checked. Wait for the verdict.

**When changes are requested:** push fixes to the same branch, reply to each
comment saying what you did (or why you disagree, which is allowed and
sometimes correct), then re-add `ready for review`.

**Disagreeing is fine.** If a review comment is wrong, say so with your
reasoning. Reviewers are not always right and a PR is a conversation, not a
verdict handed down.

**Never approve or merge your own PR.**

---

## Database migrations

These rules protect the deployed database. Getting one wrong breaks the staging
deploy for everyone, not just you.

**Never edit a migration that has already been applied.** Prisma stores a
checksum of every migration file in `_prisma_migrations`. Changing an applied
file, *even by adding or removing a single trailing newline*, makes that
checksum mismatch and `prisma migrate deploy` fails against any database that
already ran it. A PR here did exactly this with a whitespace-only edit and it
would have broken staging on merge.

**Never write a migration that creates something that already exists.** Diff
your new SQL against every existing migration before you open the PR. #64's
migration did a plain `CREATE TABLE "Truck"` when an earlier migration already
created it, so `migrate deploy` would have aborted with
`relation "Truck" already exists`.

**Regenerate rather than hand-edit** when your branch is behind. Merge
`development` first, delete your old migration, then generate a fresh one
against the current schema so it contains only your actual delta. A stale
migration usually carries changes that landed separately, which is how the same
schema change ends up applied twice.

**Never log a connection string.** `packages/db/prisma.config.ts` on one branch
printed the full `DATABASE_URL`, password included, on every `prisma generate`,
which puts it in CI logs and the staging boot log.

---

## Rules that will block a merge

These are checked on every review. None of them is a style preference.

**Every API route needs a guard.** Every route registration takes
`preHandler: [authGuard, requireRole(...)]` unless it is deliberately public
and documented as such in the same file. Count them: the number of
`app.get(`, `app.post(`, `app.patch(`, `app.delete(` calls in a route file
must equal the number of `preHandler` entries. A PR here shipped two entirely
unguarded endpoints, one of which exposed the eco-aide directory to anyone
who knew the URL.

**Identity comes from the token, never the request.** Read the user as
`request.user.sub`. Never trust a user id from the body, the query string or a
header, and never leave a placeholder. We have shipped both `"TEMP_USER"` and
`"usr-mock-1"` to `development` and had to fix them afterwards.

**Frontend calls go through `apiClient`.** Use
`apps/web/src/lib/api-client.ts`, never a bare `fetch` and never a hardcoded
`http://localhost:3000`. `apiClient` attaches the bearer token, sends the
refresh cookie and retries once on 401. A raw `fetch` sends no Authorization
header at all, so every call to a guarded endpoint returns 401. This has been
found in four separate PRs.

**Multi-row writes need a transaction.** Wrap them in `prisma.$transaction` so
a partial write cannot happen.

**Sequential display numbers come from the shared counter.** Use
`getNextSequence` from `apps/api/src/lib/counter.ts`, inside the same
transaction as the insert. Deriving a number from `count()` hands the same
value to two concurrent creates and reissues a used value after any delete,
and the column is unique, so both fail.

**Body schemas set `additionalProperties: false`** with explicit properties, so
fields like `id` or `status` cannot be set straight from the request body.

**No blanket `eslint-disable` at the top of a file.** Suppress the specific
rule on the specific line, with a reason. A blanket disable hides everything
else in the file, which is how several of the problems above survived review.

**No invented data in the UI.** If the backend does not provide a number yet,
show an empty state or hide the element. Do not fill it with a plausible
constant. Fabricated statistics are still live on `development` right now
because a placeholder read rate of `"82%"` and a read count of
`history.length * 7` shipped and were not caught until later.

---

## Before you open a PR

```bash
pnpm install
pnpm build     # must pass
pnpm lint      # must pass

git fetch origin
git merge origin/development   # resolve conflicts now, not at review time
```

Then read your own diff on GitHub, fill in the template, add
`ready for review`, and you are done.

---

## Useful commands

```bash
# See exactly what your branch changes relative to development
git diff origin/development...HEAD --stat

# How far behind development are you
git log --oneline HEAD..origin/development | wc -l

# Check a route file's guard coverage
grep -c "app\.\(get\|post\|patch\|put\|delete\)(" apps/api/src/routes/yourRoutes.ts
grep -c "preHandler:" apps/api/src/routes/yourRoutes.ts

# Confirm you have not touched an applied migration
git diff origin/development -- packages/db/prisma/migrations/

# Find raw fetch calls that should be apiClient
grep -rn "fetch(" apps/web/src/features/ | grep -v api-client
```

---

## When something goes wrong

Ask. A question in a PR comment or in the team channel costs minutes. A wrong
assumption that reaches `development` costs a lot more, and every rule on this
page started life as one.
