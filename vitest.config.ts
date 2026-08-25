import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import pdfSnapshotPlugin from './test/utils/browser-command.ts'

export default defineConfig({
  plugins: [pdfSnapshotPlugin()],
  test: {
    setupFiles: ['./test/utils/setup.ts'],
    browser: {
      enabled: true,
      instances: [
        {
          browser: 'chromium'
        }
      ],
      provider: playwright(),
      headless: true,
      screenshotFailures: false
    }
  }
})
