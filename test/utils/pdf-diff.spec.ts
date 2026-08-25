import { describe, expect, it } from 'vitest'
import { equalBytes, pdfDiff } from './pdf-diff.js'

describe('PDF diff', () => {
  it('compares binary bytes exactly', () => {
    expect(equalBytes(new Uint8Array([1, 2]), new Uint8Array([1, 2]))).toBe(-1)
    expect(equalBytes(new Uint8Array([1, 2]), new Uint8Array([1, 3]))).toBe(1)
    expect(equalBytes(new Uint8Array([1]), new Uint8Array([1, 2]))).toBe(1)
  })

  it('reports bounded escaped PDF context', () => {
    const result = pdfDiff(
      'test/anchor.pdf',
      new Uint8Array([37, 80, 68, 70, 0, 255]),
      new Uint8Array([37, 80, 68, 70, 1, 255])
    )
    expect(result).toContain('test/anchor.pdf')
    expect(result).toContain('offset 4')
    expect(result).toContain('0x00')
    expect(result).toContain('0x01')
    expect(result).toContain('- %PDF\\x00\\xff')
    expect(result).toContain('+ %PDF\\x01\\xff')
    expect(result).not.toContain('[37,')
    expect(result.length).toBeLessThanOrEqual(16384)
  })

  it('shows a unified diff around changed PDF lines', () => {
    const expected = new TextEncoder().encode('header\nkeep one\nchanged old\nkeep two\nfooter')
    const actual = new TextEncoder().encode('header\nkeep one\nchanged new\nkeep two\nfooter')
    const result = pdfDiff('test/example.pdf', expected, actual)
    expect(result).toContain('  keep one')
    expect(result).toContain('- changed old')
    expect(result).toContain('+ changed new')
    expect(result).toContain('  keep two')
  })

  it('keeps insertions aligned like a unified diff', () => {
    const expected = new TextEncoder().encode('header\nkeep one\nkeep two\nfooter')
    const actual = new TextEncoder().encode('header\ninserted\nkeep one\nkeep two\nfooter')
    const result = pdfDiff('test/example.pdf', expected, actual)
    expect(result).toContain('+ inserted')
    expect(result).toContain('  keep one')
    expect(result).toContain('  keep two')
  })
})
