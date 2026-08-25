import { describe, it, expect } from 'vitest'
import { svg2pdf } from '../../src/svg2pdf'
import jsPDF from 'jspdf'
import { loadSvg } from '../utils/loadSvg'

describe('display-none-and-visibility-inheritance', () => {
  it('display-none-and-visibility-inheritance', async () => {
    const { svgElement, width, height } = await loadSvg(
      '/test/display-none-and-visibility-inheritance/display-none-and-visibility-inheritance.svg'
    )
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot(
      './display-none-and-visibility-inheritance.pdf'
    )
  })
})
