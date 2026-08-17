import { defineConfig } from 'oxlint'

export default defineConfig({
  ignorePatterns: ['.github/**', 'dist/**', 'test/unit/dist/**', 'test/deployment/**'],
  plugins: ['typescript', 'import', 'promise'],
  rules: {
    'no-use-before-define': ['error', { functions: false, classes: false }],
    'typescript/no-non-null-assertion': 'off',
    'typescript/ban-ts-comment': 'off'
  }
})
