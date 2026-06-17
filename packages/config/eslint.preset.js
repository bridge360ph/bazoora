import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// Shared, type-aware ESLint base for every package in the monorepo.
// Consumers spread `baseConfig` and add their own environment globals,
// plugins (React, etc.), and `tsconfigRootDir`.
//
// Type-checked rules are scoped to TS files only so plain `.js` config
// files (like this one) don't trip the type-aware parser.
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
})

export { globals }
