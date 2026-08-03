# @bazoora/api — Backend

Fastify + TypeScript API server for the Bazoora waste management platform. Run
in development with `tsx`; response types are shared with the frontend through
`@bazoora/shared`.

## Setup

This package is part of the root pnpm workspace — run `pnpm install` from the
repo root, not here. Then:

```bash
pnpm dev   # starts the API on http://localhost:3000
```

## Scripts

Run from this directory with `pnpm <script>`, or from the root with
`pnpm --filter @bazoora/api <script>`.

| Script      | Description                                  |
| ----------- | -------------------------------------------- |
| `dev`       | Start the server with tsx (reloads on change)|
| `build`     | Compile TypeScript to `dist/`                |
| `typecheck` | Type-check without emitting                  |
| `lint`      | Lint with ESLint (type-aware rules)          |

---

## How this app is organized

> New here? Read this section top to bottom. It explains the one file that
> exists today and **where new code should go** as the API grows. Follow these
> conventions so the server stays predictable.

### What exists now

```
apps/api/
├── eslint.config.js     # ESLint; extends the shared @bazoora/config preset
├── tsconfig.json        # compiler options; extends @bazoora/config base
└── src/
    └── server.ts        # ENTRY POINT — builds the app, registers, listens
```

**`server.ts`** is the entry point. Today it does everything: creates the
Fastify instance (with logging on), registers the CORS plugin, declares the
`GET /` health route, and listens. That's fine for one route — but it does
**not** scale. As soon as there's more than a couple of routes, split it up as
described below.

### Where to put new code

Create these folders under `src/` as you need them.

```
src/
├── server.ts      # thin entry: build the app, register plugins/routes, listen
├── app.ts         # (optional) build & return the configured Fastify instance,
│                  #   so tests can import the app without it listening
├── routes/        # one file per resource; each exports a Fastify plugin
│   ├── health.ts
│   └── schedules.ts
├── plugins/       # cross-cutting Fastify plugins (cors, db, auth, config)
├── services/      # business logic, independent of HTTP (callable from routes)
├── schemas/       # JSON schemas for request/response validation
└── lib/           # small framework-agnostic helpers
```

Rules of thumb:

- **Routes are plugins.** Group endpoints by resource, one file each, exported
  as a Fastify plugin and registered (optionally under a `prefix`):

  ```ts
  // src/routes/schedules.ts
  import type { FastifyPluginAsync } from "fastify";

  export const schedulesRoutes: FastifyPluginAsync = async (app) => {
    app.get("/", async () => {
      /* ... */
    });
  };

  // src/server.ts
  await app.register(schedulesRoutes, { prefix: "/schedules" });
  ```

- **Keep `server.ts` thin.** It should read as a list of registrations, not
  contain business logic. Push logic into `services/`.
- **Share contract types.** Request/response shapes that the frontend also uses
  belong in `@bazoora/shared`, not here. The health route already does this:

  ```ts
  import type { HealthResponse } from "@bazoora/shared";

  app.get("/", (): HealthResponse => ({ status: "ok" }));
  ```

### Logging — not `console.log`

The Fastify instance is created with `{ logger: true }`. Use the request/app
logger, never `console.log` (the linter blocks it):

```ts
app.log.info("server starting");
request.log.warn({ userId }, "rate limit near");
```

`console.error` is allowed and is the right fallback at the very top level (the
`start().catch(...)` in `server.ts`), where the app logger may not exist yet.

### Validation

Prefer Fastify's built-in JSON-schema validation over hand-written checks. Put
schemas in `src/schemas/` and attach them to routes via the `schema` option —
this validates input at the system boundary and shapes the response.

### Configuration

The port is currently hard-coded to `3000`. When configuration grows
(database URL, secrets), read it from environment variables — never commit a
`.env`. Centralize parsing in `src/plugins/config.ts` so the rest of the code
reads typed config, not `process.env` directly.

### Code quality (enforced by ESLint + CI)

- No explicit `any` — use a precise type, or `unknown` and narrow it.
- No `console.log` — use `app.log` / `request.log`; `console.warn`/`error`
  allowed.
- Type-aware rules run in CI and the pre-push hook; a red lint blocks the push.

### TypeScript config

`tsconfig.json` extends the shared base in `@bazoora/config` and adds the
Node-specific options (`nodenext` modules, `outDir: dist`, declaration output).
