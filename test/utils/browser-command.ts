import { promises as fs } from 'node:fs'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import type { Plugin } from 'vitest/config'
import type { BrowserCommand, BrowserCommandContext } from 'vitest/node'
import { pdfDiff, equalBytes } from './pdf-diff.js'

export interface PdfSnapshotRequest {
  snapshotPath: string
  actual: number[]
}

export type PdfSnapshotResult =
  | { pass: true; updated: boolean }
  | { pass: false; reason: 'missing' | 'mismatch'; diff: string }

function normalizedForComparison(bytes: Uint8Array): Uint8Array {
  const result = new Uint8Array(bytes)
  let text = ''
  for (let i = 0; i < bytes.length; i++) text += String.fromCharCode(bytes[i])
  const creationDate = /\/CreationDate \(D:[^)]*\)/.exec(text)
  if (creationDate) {
    const start = creationDate.index + creationDate[0].indexOf('D:')
    const end = creationDate.index + creationDate[0].length - 1
    for (let i = start; i < end; i++) result[i] = 48
  }
  const id = /\/ID \[ <([0-9A-Fa-f]+)> <([0-9A-Fa-f]+)> \]/.exec(text)
  if (id) {
    const first = id.index + id[0].indexOf('<') + 1
    const second = id.index + id[0].lastIndexOf('<') + 1
    for (let i = 0; i < id[1].length; i++) {
      result[first + i] = 48
      result[second + i] = 48
    }
  }
  return result
}

function isInside(root: string, path: string): boolean {
  const relativePath = relative(root, path)
  return relativePath === '' || (!relativePath.startsWith('..') && !isAbsolute(relativePath))
}

export async function matchPdfSnapshot(
  context: BrowserCommandContext,
  request: PdfSnapshotRequest
): Promise<PdfSnapshotResult> {
  if (!context.testPath) throw new Error('PDF snapshots require an active test file')
  const root = resolve(context.project.config.root)
  const snapshotPath = resolve(dirname(context.testPath), request.snapshotPath)
  if (!isInside(root, snapshotPath)) {
    throw new Error(`PDF snapshot path is outside the project root: ${request.snapshotPath}`)
  }

  const actual = new Uint8Array(request.actual)
  let expected: Uint8Array
  try {
    expected = new Uint8Array(await fs.readFile(snapshotPath))
  } catch (error) {
    if ((error as { code?: string }).code !== 'ENOENT') throw error
    if (context.project.config.update) {
      await fs.mkdir(dirname(snapshotPath), { recursive: true })
      await fs.writeFile(snapshotPath, actual)
      return { pass: true, updated: true }
    }
    return { pass: false, reason: 'missing', diff: pdfDiff(snapshotPath, undefined, actual) }
  }

  if (equalBytes(normalizedForComparison(expected), normalizedForComparison(actual)) === -1) {
    return { pass: true, updated: false }
  }
  if (context.project.config.update) {
    const temporaryPath = `${snapshotPath}.${Date.now()}.tmp`
    await fs.writeFile(temporaryPath, actual)
    await fs.rename(temporaryPath, snapshotPath)
    return { pass: true, updated: true }
  }
  return { pass: false, reason: 'mismatch', diff: pdfDiff(snapshotPath, expected, actual) }
}

export default function pdfSnapshotPlugin(): Plugin {
  return {
    name: 'pdf-snapshot-browser-command',
    config() {
      return {
        test: {
          browser: {
            commands: {
              matchPdfSnapshot: matchPdfSnapshot as BrowserCommand<any[], PdfSnapshotResult>
            }
          }
        }
      }
    }
  }
}
