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
│   ├── shared/     # @bazoora/shared — API contract types shared by web + api
│   └── config/     # @bazoora/config — shared tsconfig base + ESLint preset
├── docs/
├── turbo.json          # Turborepo task pipeline
├── pnpm-workspace.yaml
└── package.json        # workspace root (scripts + tooling)
```

Packages reference each other with the `workspace:*` protocol, so `@bazoora/web`
and `@bazoora/api` both import the same `HealthResponse` type from
`@bazoora/shared` — one source of truth for the API contract.

## Getting started

Prerequisites: Node.js 20+ and [pnpm](https://pnpm.io) 10+ (this is a pnpm
workspace; npm/yarn lockfiles are gitignored).

Install the whole workspace from the repo root:

```bash
pnpm install   # installs every package + root tooling
```

Then run the services (in separate terminals):

```bash
pnpm dev:api                              # API on http://localhost:3000
cp apps/web/.env.example apps/web/.env    # set VITE_API_URL if the API is elsewhere
pnpm dev:web                              # client on http://localhost:5173
```

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
