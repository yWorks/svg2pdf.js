import { describe, it, expect } from 'vitest'
import { svg2pdf } from '../../src/svg2pdf'
import jsPDF from 'jspdf'
import { loadSvg } from '../utils/loadSvg'

describe('svg-viewbox', () => {
  it('svg-viewbox', async () => {
    const { svgElement, width, height } = await loadSvg('/test/svg-viewbox/svg-viewbox.svg')
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./svg-viewbox.pdf')
  })
})
