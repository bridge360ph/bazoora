# @bazoora/web — Frontend

React 19 + TypeScript + Vite PWA client for the Bazoora waste management
platform. Styling via Tailwind CSS; server state via TanStack Query. API types
come from `@bazoora/shared`.

## Setup

This package is part of the root pnpm workspace — run `pnpm install` from the
repo root, not here. Then:

```bash
cp .env.example .env   # set VITE_API_URL if the backend is not on localhost:3000
pnpm dev
```

## Scripts

Run from this directory with `pnpm <script>`, or from the root with
`pnpm --filter @bazoora/web <script>`.

| Script    | Description                          |
| --------- | ------------------------------------ |
| `dev`     | Start the Vite dev server            |
| `build`   | Type-check and build for production  |
| `lint`    | Lint with ESLint (type-aware rules)  |
| `preview` | Preview the production build         |

## Environment

| Variable       | Description               | Default                 |
| -------------- | ------------------------- | ----------------------- |
| `VITE_API_URL` | Base URL of the backend   | `http://localhost:3000` |

## TypeScript config

The project uses Vite's standard project-references split, each file extending
the shared base in `@bazoora/config`:

- `tsconfig.json` — solution file; references the two below
- `tsconfig.app.json` — app/browser code under `src/`
- `tsconfig.node.json` — Node-side tooling (`vite.config.ts`)
