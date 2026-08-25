import 'vitest'
import 'vitest/internal/browser'

declare module 'vitest/internal/browser' {
  interface BrowserCommands {
    matchPdfSnapshot(
      request: import('./browser-command.js').PdfSnapshotRequest
    ): Promise<import('./browser-command.js').PdfSnapshotResult>
  }
}

declare module 'vitest' {
  interface Assertion<T = any> {
    toMatchPdfSnapshot(filepath: string): Promise<T>
  }
}
