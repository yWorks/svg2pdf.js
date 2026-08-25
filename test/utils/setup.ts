import { expect } from 'vitest'
import { commands } from 'vitest/browser'
import type { PdfSnapshotRequest, PdfSnapshotResult } from './browser-command.js'

const pdfCommands = commands as typeof commands & {
  matchPdfSnapshot(request: PdfSnapshotRequest): Promise<PdfSnapshotResult>
}

function toBytes(value: unknown): number[] {
  if (value instanceof ArrayBuffer) return Array.from(new Uint8Array(value))
  if (ArrayBuffer.isView(value)) {
    return Array.from(new Uint8Array(value.buffer, value.byteOffset, value.byteLength))
  }
  throw new TypeError(
    'toMatchPdfSnapshot() received an unsupported value; expected ArrayBuffer or ArrayBufferView'
  )
}

expect.extend({
  async toMatchPdfSnapshot(received: unknown, filepath: string) {
    if (this.isNot) throw new Error('toMatchPdfSnapshot() cannot be used with .not')
    const result = await pdfCommands.matchPdfSnapshot({
      snapshotPath: filepath,
      actual: toBytes(received)
    })
    return { pass: result.pass, message: () => (result.pass ? '' : result.diff) }
  }
})
