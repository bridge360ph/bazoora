# Bazoora

Digital Waste Management Platform — a Progressive Web App (PWA) that digitizes
waste collection and coordination for local communities. It connects Local
Government Units (LGUs), private hauling organizations, businesses, and
residents on a single platform with real-time visibility, structured
scheduling, and digital reporting.

See [`Bazoora PRD.pdf`](./Bazoora%20PRD.pdf) for the full product requirements.

## Stack

| Layer    | Tech                                                     |
| -------- | -------------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, TanStack Query |
| Backend  | Fastify, TypeScript, tsx                                 |
| Tooling  | pnpm workspaces, Turborepo, ESLint (type-aware), Husky   |

## Monorepo layout

A pnpm + Turborepo monorepo. Applications live in `apps/`, shared libraries in
`packages/`.

```
bazoora-app/
├── apps/
│   ├── web/        # @bazoora/web  — React + Vite PWA client
│   └── api/        # @bazoora/api  — Fastify API server
├── packages/
│   ├── db/         # @bazoora/db — Prisma schema, migrations, shared client
│   ├── shared/     # @bazoora/shared — API contract types shared by web + api
│   ├── ui/         # @bazoora/ui — shared component library
│   └── config/     # @bazoora/config — shared tsconfig base + ESLint preset
├── docs/
├── docker-compose.yml  # local Postgres
├── turbo.json          # Turborepo task pipeline
├── pnpm-workspace.yaml
└── package.json        # workspace root (scripts + tooling)
```

Packages reference each other with the `workspace:*` protocol, so `@bazoora/web`
and `@bazoora/api` both import the same `HealthResponse` type from
`@bazoora/shared` — one source of truth for the API contract.

## Getting started

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io) 10+ (this is a pnpm workspace; npm/yarn lockfiles
  are gitignored)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/), running,
  for the local Postgres database

Run every command below from the repo root. On Windows, use Git Bash (or
replace `cp` with `copy` in PowerShell).

### 1. Install dependencies

```bash
pnpm install   # installs every package + root tooling, generates the Prisma client
```

### 2. Start the database

```bash
docker compose up -d   # Postgres 17 on localhost:5432, container "bazoora-db"
docker ps              # bazoora-db should show "Up (healthy)"
```

### 3. Create the `.env` files

There are three, one per package that needs configuration. None of them are
committed.

```bash
cp packages/db/.env.example packages/db/.env   # used by Prisma migrations
cp apps/api/.env.example    apps/api/.env      # used by the API and seed scripts
cp apps/web/.env.example    apps/web/.env      # used by the web client
```

The DB and web examples work as-is for local development. In `apps/api/.env`,
fill in:

| Variable                   | What to put                                                                 |
| -------------------------- | --------------------------------------------------------------------------- |
| `AUTH_SECRET`              | Any long random string. The API will not start without it.                  |
| `CORS_ORIGIN`              | Already `http://localhost:5173`. If it is blank, login fails with a CORS error. |
| `SEED_*_PASSWORD`          | Passwords for the test accounts (8+ chars, upper, lower, number, symbol).   |

The `AWS_*` values are only needed for image uploads. Ask the team for them if
you are working on that feature.

### 4. Apply the migrations

```bash
pnpm --filter @bazoora/db db:deploy
```

### 5. Seed test accounts

Each script creates (or updates) one user with the email and password from
`apps/api/.env`:

```bash
pnpm --filter @bazoora/api seed:super-admin   # SEED_ADMIN_*     → SUPER_ADMIN
pnpm --filter @bazoora/api seed:eco-aide      # SEED_ECO_AIDE_*  → ECO_AIDE
pnpm --filter @bazoora/api seed:resident      # SEED_RESIDENT_*  → RESIDENT
pnpm --filter @bazoora/api seed:driver        # SEED_DRIVER_*    → DRIVER
```

The eco-aide and driver seeds refuse to run unless `NODE_ENV=development`,
which the example `.env` already sets.

### 6. Run the app

In two terminals:

```bash
pnpm dev:api   # API on http://localhost:3000
pnpm dev:web   # client on http://localhost:5173
```

Open http://localhost:5173 and log in with one of the seeded accounts.

### Troubleshooting

| Symptom                                         | Fix                                                                                     |
| ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| `AUTH_SECRET is required`                       | `apps/api/.env` is missing or `AUTH_SECRET` is blank.                                   |
| `DATABASE_URL is required`                      | `apps/api/.env` is missing `DATABASE_URL`.                                              |
| Login fails, browser console shows a CORS error | Set `CORS_ORIGIN=http://localhost:5173` in `apps/api/.env` and restart the API.          |
| `Can't reach database server at localhost:5432` | Docker Desktop isn't running, or run `docker compose up -d`.                            |
| `relation "..." does not exist`                 | Migrations weren't applied. Run step 4.                                                 |
| Seed fails with `NODE_ENV must be ... 'development'` | Add `NODE_ENV=development` to `apps/api/.env`.                                     |

To wipe the local database and start over, see
[`packages/db/README.md`](./packages/db/README.md#resetting-the-database).

## Scripts

Turborepo orchestrates tasks across packages (parallel, dependency-aware,
cached). Run from the repo root:

| Script           | Description                                             |
| ---------------- | ------------------------------------------------------ |
| `pnpm dev`       | Run every package's dev task                           |
| `pnpm dev:web`   | Start the Vite dev server only                         |
| `pnpm dev:api`   | Start the API (tsx watch) only                         |
| `pnpm build`     | Build all packages (`shared` builds before its dependents) |
| `pnpm lint`      | Lint every package (type-aware ESLint)                 |
| `pnpm typecheck` | Type-check every package                               |

Single-package commands: `pnpm --filter @bazoora/web <script>` or
`turbo run <task> --filter=@bazoora/api`.

## Git hooks

[Husky](https://typicode.github.io/husky/) is installed via the root `prepare`
script on `pnpm install`:

- **pre-commit** — `turbo run lint` across the workspace
- **pre-push** — `turbo run build typecheck` across the workspace

## Contributing

Read [`docs/git-workflow.md`](./docs/git-workflow.md) before your first pull
request. It covers branching, commit format, PR scope, the review labels, the
migration rules, and the checks that will block a merge.
