# Bazoora

Digital Waste Management Platform — a Progressive Web App (PWA) that digitizes
waste collection and coordination for local communities. It connects Local
Government Units (LGUs), private hauling organizations, businesses, and
residents on a single platform with real-time visibility, structured
scheduling, and digital reporting.

See [`Bazoora PRD.pdf`](./Bazoora%20PRD.pdf) for the full product requirements.

## Stack

| Layer    | Tech                                                           |
| -------- | -------------------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, TanStack Query       |
| Backend  | Fastify, TypeScript, tsx                                       |
| Database | PostgreSQL 17, Prisma ORM 7                                    |
| Tooling  | pnpm workspaces, Turborepo, ESLint (type-aware), Husky, Docker |

## Monorepo layout

A pnpm + Turborepo monorepo. Applications live in `apps/`, shared libraries in
`packages/`.

```text
bazoora-app/
├── apps/
│   ├── web/        # @bazoora/web     — React + Vite PWA client
│   └── api/        # @bazoora/api     — Fastify API server
├── packages/
│   ├── db/         # @bazoora/db      — Prisma schema, migrations, database client
│   ├── shared/     # @bazoora/shared  — API contract types shared by web + api
│   └── config/     # @bazoora/config  — shared tsconfig base + ESLint preset
├── docs/
├── docker-compose.yml
├── turbo.json          # Turborepo task pipeline
├── pnpm-workspace.yaml
└── package.json        # workspace root (scripts + tooling)
```

Packages reference each other with the `workspace:*` protocol. Shared types live
in `@bazoora/shared`, while database schema and migrations are managed through
`@bazoora/db`.

## Getting Started

### Prerequisites

* Node.js 20+
* pnpm 10+
* Docker Desktop

This is a pnpm workspace; npm/yarn lockfiles are gitignored.

### Install Dependencies

From the repository root:

```bash
pnpm install
```

### Start the Database

The project uses PostgreSQL 17 running in Docker.

Start the database:

```bash
docker compose up -d
```

Verify the container is running:

```bash
docker ps
```

You should see:

```text
bazoora-db
```

### Configure Environment Variables

Database configuration is managed through:

```text
packages/db/.env
```

Create the file from the example:

```bash
cp packages/db/.env.example packages/db/.env
```

### Generate Prisma Client

```bash
pnpm --filter @bazoora/db db:generate
```

### Run Database Migrations

```bash
pnpm --filter @bazoora/db db:migrate
```

### Start the Applications

Run the services in separate terminals:

```bash
pnpm dev:api                              # API on http://localhost:3000
cp apps/web/.env.example apps/web/.env    # set VITE_API_URL if the API is elsewhere
pnpm dev:web                              # client on http://localhost:5173
```

## Database Development

The database layer is managed through the `@bazoora/db` package.

### Open PostgreSQL Shell

```bash
docker exec -it bazoora-db psql -U postgres -d bazoora
```

Useful commands:

```sql
\dt
```

List all tables.

```sql
\d "TableName"
```

Describe a table.

```sql
\q
```

Exit PostgreSQL.

### Updating the Schema

Database entities are defined in:

```text
packages/db/prisma/schema.prisma
```

After modifying the schema:

```bash
pnpm --filter @bazoora/db db:migrate
pnpm --filter @bazoora/db db:generate
```

## Scripts

Turborepo orchestrates tasks across packages (parallel, dependency-aware,
cached). Run from the repo root:

| Script           | Description                    |
| ---------------- | ------------------------------ |
| `pnpm dev`       | Run every package's dev task   |
| `pnpm dev:web`   | Start the Vite dev server only |
| `pnpm dev:api`   | Start the API only             |
| `pnpm build`     | Build all packages             |
| `pnpm lint`      | Lint every package             |
| `pnpm typecheck` | Type-check every package       |

### Database Scripts

| Script                                  | Description                 |
| --------------------------------------- | --------------------------- |
| `pnpm --filter @bazoora/db db:generate` | Generate Prisma Client      |
| `pnpm --filter @bazoora/db db:migrate`  | Create and apply migrations |
| `pnpm --filter @bazoora/db db:studio`   | Open Prisma Studio          |

Single-package commands:

```bash
pnpm --filter <package-name> <script>
```

Examples:

```bash
pnpm --filter @bazoora/api dev
pnpm --filter @bazoora/web build
pnpm --filter @bazoora/db db:migrate
```

## Git Hooks

[Husky](https://typicode.github.io/husky/) is installed via the root `prepare`
script on `pnpm install`:

* **pre-commit** — `turbo run lint` across the workspace
* **pre-push** — `turbo run build typecheck` across the workspace