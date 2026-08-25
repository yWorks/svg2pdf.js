import { describe, it, expect } from 'vitest'
import { svg2pdf } from '../../src/svg2pdf'
import jsPDF from 'jspdf'
import { loadSvg } from '../utils/loadSvg'

describe('rgb-color-percent', () => {
  it('rgb-color-percent', async () => {
    const { svgElement, width, height } = await loadSvg(
      '/test/rgb-color-percent/rgb-color-percent.svg'
    )
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./rgb-color-percent.pdf')
  })
})
