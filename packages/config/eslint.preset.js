import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// Shared, type-aware ESLint base for every package in the monorepo.
// Consumers spread `baseConfig` and add their own environment globals,
// plugins (React, etc.), and `tsconfigRootDir`.
//
// Type-checked rules are scoped to TS files only so plain `.js` config
// files (like this one) don't trip the type-aware parser.
//
// On top of typescript-eslint's type-checked rules (which already ban the
// unsafe `any` escape hatches via no-unsafe-*), we forbid:
//   - explicit `any` annotations — use a precise type, or `unknown` and
//     narrow before use,
//   - `console.log` — keep logs out of committed code; `console.warn` and
//     `console.error` stay allowed for genuine warnings/errors (servers
//     should prefer a real logger, e.g. Fastify's `app.log`).
export const baseConfig = tseslint.config({
  files: ['**/*.{ts,tsx}'],
  extends: [
    js.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
  ],
  languageOptions: {
    parserOptions: {
      projectService: true,
    },
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    'no-console': ['error', { allow: ['warn', 'error'] }],
  },
})

export { globals }
