import { describe, it, expect } from 'vitest'
import { svg2pdf } from '../../src/svg2pdf'
import jsPDF from 'jspdf'
import { loadSvg } from '../utils/loadSvg'

describe('font-family-unquoted-utf8', () => {
  it('accepts unquoted non-ASCII font-family attribute values', async () => {
    const { svgElement, width, height } = await loadSvg(
      '/test/font-family-unquoted-utf8/font-family-unquoted-utf8.svg'
    )
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await expect(svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })).resolves.toBeDefined()
    const output = pdf.output('arraybuffer')
    expect(output.byteLength).toBeGreaterThan(0)
  })
})
