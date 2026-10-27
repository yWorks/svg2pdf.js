import { describe, it, expect, vi } from 'vitest'
import { svg2pdf } from '../../src/svg2pdf'
import jsPDF from 'jspdf'
import { loadSvg } from '../utils/loadSvg'

function createdStyleElements(spy: {
  mock: { results: { value: unknown }[] }
}): HTMLStyleElement[] {
  return spy.mock.results
    .map((r: { value: unknown }) => r.value)
    .filter((el): el is HTMLStyleElement => el instanceof HTMLStyleElement)
}

describe('style-nonce', () => {
  it('applies styleNonce to internally created style elements only when provided', async () => {
    const { svgElement } = await loadSvg('/test/style-nonce/style-nonce.svg')
    const spy = vi.spyOn(Document.prototype, 'createElement')

    try {
      const pdf = new jsPDF('l', 'pt', [400, 300])
      await svg2pdf(svgElement, pdf, { styleNonce: 'test-nonce' })

      const styles = createdStyleElements(spy)
      expect(styles.length).toBeGreaterThan(0)
      for (const el of styles) {
        expect(el.nonce).toBe('test-nonce')
      }

      spy.mockClear()
      const pdf2 = new jsPDF('l', 'pt', [400, 300])
      await svg2pdf(svgElement, pdf2, {})

      for (const el of createdStyleElements(spy)) {
        expect(el.nonce).toBe('')
      }
    } finally {
      spy.mockRestore()
    }
  })
})
