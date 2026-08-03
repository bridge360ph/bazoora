import { defineConfig, globalIgnores } from 'eslint/config'
import { baseConfig, globals } from '@bazoora/config/eslint.preset.js'

export default defineConfig([
  globalIgnores(['dist']),
  ...baseConfig,
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
