## Summary
<!-- One or two sentences describing what this PR does and why. -->

## Type of Change
<!-- Check all that apply -->
- [ ] Bug fix
- [ ] New feature
- [ ] Refactor (no behavior change)
- [ ] UI / styling
- [ ] Database / schema change
- [ ] Config / infrastructure
- [ ] Docs / comments
- [ ] Tests only

---

## Packages Affected
<!-- Check all packages in the monorepo touched by this PR -->
- [ ] `apps/web` — Frontend PWA (React + Vite)
- [ ] `apps/api` — Backend API (Fastify + TypeScript)
- [ ] `packages/db` — Prisma schema & migrations
- [ ] `packages/ui` — Shared component library
- [ ] `packages/types` — Shared TypeScript types
- [ ] `packages/config` — Shared configs (ESLint, Tailwind, tsconfig)
- [ ] Other: <!-- specify -->

---

## What Changed
<!-- Bullet points are fine. Be specific enough that a reviewer can follow without running the code. -->
- 
- 
- 

## Database Changes
<!-- Fill in if packages/db was affected; otherwise delete this section -->
- **Migration file:** `prisma/migrations/...`
- **Models affected:**
- **Breaking:** Yes / No
- **Rollback plan:**

## Environment Variables
<!-- List any new or changed env vars; otherwise delete this section -->
| Variable | Package | Required | Notes |
|----------|---------|----------|-------|
| `ENV_VAR_NAME` | `apps/api` | Yes/No | Description |

---

## Testing
<!-- Describe how you verified this works -->
- [ ] Unit tests added / updated
- [ ] Manual testing done

**Steps to test manually:**
1. 
2. 
3. 

**Expected result:**

---

## Screenshots / Screen Recording
<!-- Required for any UI change in apps/web; delete if backend-only -->


---

## Checklist
- [ ] PR title follows `type(scope): description` format — e.g. `feat(api): add hauling request endpoint`
- [ ] No `console.log` left in production code
- [ ] No hardcoded secrets or API keys
- [ ] Prisma migrations run cleanly (`pnpm db:migrate`)
- [ ] Types are shared via `packages/types`, not duplicated
- [ ] Touched components are responsive (mobile + desktop)
- [ ] Relevant Notion ticket linked below

---

## Related
<!-- Link Notion ticket, GitHub issue, or design file -->
- Ticket:
- Design:
- Depends on PR:
