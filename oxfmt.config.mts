import { defineConfig } from 'oxfmt'

export default defineConfig({
  ignorePatterns: ['.github/**', 'dist/**', 'test/unit/dist/**'],
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: false,
  singleQuote: true,
  bracketSpacing: true,
  arrowParens: 'avoid',
  trailingComma: 'none',
  endOfLine: 'lf'
})
