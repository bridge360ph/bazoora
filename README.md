# Bazoora

Digital Waste Management Platform — a Progressive Web App (PWA) that digitizes
waste collection and coordination for local communities. It connects Local
Government Units (LGUs), private hauling organizations, businesses, and
residents on a single platform with real-time visibility, structured
scheduling, and digital reporting.

See [`Bazoora PRD.pdf`](./Bazoora%20PRD.pdf) for the full product requirements.

## Stack

| Layer    | Tech                                              |
| -------- | ------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, TanStack Query |
| Backend  | Fastify, TypeScript, tsx                          |

## Repository layout

```
bazoora-app/
├── frontend/   # React + Vite PWA client
├── backend/    # Fastify API server
└── docs/       # Project documentation
```

## Getting started

Prerequisites: Node.js 20+ and [pnpm](https://pnpm.io) 10+ (this is a pnpm
workspace; npm/yarn lockfiles are gitignored).

Install everything from the repo root:

```bash
pnpm install   # installs frontend, backend, and root tooling
```

Then run each service (in separate terminals):

```bash
pnpm dev:backend                  # API on http://localhost:3000
cp frontend/.env.example frontend/.env   # set VITE_API_URL if backend is elsewhere
pnpm dev:frontend                 # client on http://localhost:5173
```

## Scripts

Run from the repo root:

| Script               | Description                            |
| -------------------- | -------------------------------------- |
| `pnpm dev:frontend`  | Start the Vite dev server              |
| `pnpm dev:backend`   | Start the API with tsx (watch)         |
| `pnpm lint`          | Lint the frontend (type-aware ESLint)  |
| `pnpm build`         | Type-check and build the frontend      |
| `pnpm typecheck`     | Type-check the backend                 |

Package-scoped scripts are available via `pnpm --filter <frontend|backend> <script>`.

## Git hooks

This repo uses [Husky](https://typicode.github.io/husky/), installed via the
root `prepare` script on `pnpm install`:

- **pre-commit** — lints staged frontend code
- **pre-push** — type-checks the frontend and backend before pushing
