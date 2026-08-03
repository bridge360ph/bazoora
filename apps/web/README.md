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

---

## How this app is organized

> New here? Read this section top to bottom. It explains every file that
> exists today and, more importantly, **where new code should go** as the app
> grows. Follow these conventions so the codebase stays predictable.

### What exists now

```
apps/web/
├── index.html            # HTML shell; Vite injects the JS bundle here
├── .env.example          # template for local env vars (copy to .env)
├── vite.config.ts        # Vite config: React + Tailwind plugins
├── eslint.config.js      # ESLint; extends the shared @bazoora/config preset
├── tsconfig.json         # TS "solution" file — references the two below
├── tsconfig.app.json     # compiler options for browser code in src/
├── tsconfig.node.json     # compiler options for tooling (vite.config.ts)
└── src/
    ├── main.tsx          # ENTRY POINT — mounts <App>, wires providers
    ├── App.tsx           # root component
    ├── index.css         # global styles + Tailwind import
    └── vite-env.d.ts     # ambient types for import.meta.env
```

**`main.tsx`** is the entry point. It creates the React root and wraps the app
in providers — today just TanStack Query's `QueryClientProvider`. Anything that
must wrap the whole app (a router, a theme provider, an auth context) is
registered here.

**`App.tsx`** is the root component. Right now it just fetches and shows the
backend health status. As real screens arrive, `App` becomes the place that
sets up routing and renders the top-level layout — not the place where feature
UI lives.

### Where to put new code

Create these folders under `src/` as you need them. None exist yet — that's
fine; add the first file and the folder is born.

```
src/
├── components/   # reusable, presentational UI (Button, Card, Spinner…)
├── features/     # one folder per feature/domain (schedules/, tracking/…)
│   └── schedules/
│       ├── components/   # UI used only by this feature
│       ├── hooks/        # feature-specific hooks
│       └── api.ts        # this feature's queries/mutations
├── hooks/        # cross-feature reusable hooks (useDebounce…)
├── lib/          # framework-agnostic helpers (fetch client, formatters)
├── pages/        # top-level route components (when routing is added)
└── types/        # local UI types — NOT API contracts (those live in @bazoora/shared)
```

Rules of thumb:

- **Feature-first.** Code used by one feature lives inside that feature's
  folder. Promote it to `components/`, `hooks/`, or `lib/` only when a second
  feature needs it. Don't pre-emptively make everything "shared".
- **One component per file.** Filename matches the component:
  `ScheduleCard.tsx` exports `ScheduleCard`.
- **No barrel `index.ts` re-export files** unless a folder's public surface is
  genuinely stable — they cause needless rebuilds and circular imports.

### Data fetching

Server data goes through **TanStack Query** — never a bare `useEffect` +
`fetch`. Put query functions next to the feature that uses them and call them
with `useQuery`/`useMutation`. Example pattern (see `App.tsx`):

```ts
import { useQuery } from "@tanstack/react-query";
import type { HealthResponse } from "@bazoora/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_URL}/`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return (await res.json()) as HealthResponse;
}
```

**API request/response types come from `@bazoora/shared`** — never redeclare a
backend type here. If the API gains an endpoint, add its types to the shared
package first, then import them on both sides.

### Styling

Tailwind CSS (v4). `src/index.css` is the single entry (`@import
"tailwindcss";`). Prefer utility classes in markup; reach for a CSS file only
for things utilities can't express.

### Adding an environment variable

1. Add it to `.env.example` (and your local `.env`). It **must** start with
   `VITE_` to be exposed to the browser.
2. Declare its type in `src/vite-env.d.ts` so `import.meta.env.X` is typed.

### Code quality (enforced by ESLint + CI)

- No explicit `any` — use a precise type, or `unknown` and narrow it.
- No `console.log` (`console.warn`/`console.error` are allowed).
- Type-aware rules run in CI and the pre-push hook; a red lint blocks the push.

### TypeScript config

Vite's standard project-references split, each file extending the shared base
in `@bazoora/config`:

- `tsconfig.json` — solution file; references the two below
- `tsconfig.app.json` — app/browser code under `src/`
- `tsconfig.node.json` — Node-side tooling (`vite.config.ts`)
