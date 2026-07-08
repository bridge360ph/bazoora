import { defineConfig, globalIgnores } from 'eslint/config'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { baseConfig, globals } from '@bazoora/config/eslint.preset.js'

export default defineConfig([
  globalIgnores([
    'dist',
    'src/features/**',
    'src/components/**',
    'src/layouts/**',
    'src/lib/**',
    'src/main.tsx',
    'src/hooks/**',
    'src/stores/**',
    'vite.config.ts',
  ]),
  ...baseConfig,
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
