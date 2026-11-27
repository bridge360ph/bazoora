# @bazoora/db

Prisma schema, migrations and the shared Prisma client used by `@bazoora/api`.

```
packages/db/
├── prisma/
│   ├── schema.prisma     # data model
│   └── migrations/       # applied in order by prisma migrate
├── prisma.config.ts      # reads DATABASE_URL from packages/db/.env
└── src/                  # exports the shared `prisma` client
```

## Local database

Postgres runs in Docker. From the repo root:

```bash
docker compose up -d     # starts Postgres 17 as container "bazoora-db" on port 5432
docker ps                # bazoora-db should show "Up (healthy)"
```

Credentials (local only): user `postgres`, password `postgres`, database
`bazoora`.

## Environment

Prisma CLI commands run from this package, so they read **this package's**
`.env`, not the API's:

```bash
cp packages/db/.env.example packages/db/.env
```

The API reads its own `DATABASE_URL` from `apps/api/.env`. Both should point at
the same database.

## Scripts

Run from the repo root with `pnpm --filter @bazoora/db <script>`.

| Script        | What it does                                                        |
| ------------- | ------------------------------------------------------------------- |
| `db:deploy`   | Apply all existing migrations. Use this on a fresh database.        |
| `db:migrate`  | Create a new migration from schema changes, then apply it.          |
| `db:generate` | Regenerate the Prisma client (also runs on `pnpm install`).         |
| `db:studio`   | Open Prisma Studio to browse the data in a browser.                 |

Read the migration rules in [`docs/git-workflow.md`](../../docs/git-workflow.md#database-migrations)
before creating or changing a migration.

## Resetting the database

This deletes all local data:

```bash
docker compose down -v
docker compose up -d
pnpm --filter @bazoora/db db:deploy
```

Then re-run the seed scripts (see the root README).
