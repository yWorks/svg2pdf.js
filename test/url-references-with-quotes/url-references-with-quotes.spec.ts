import { describe, it, expect } from 'vitest'
import { svg2pdf } from '../../src/svg2pdf'
import jsPDF from 'jspdf'
import { loadSvg } from '../utils/loadSvg'

describe('url-references-with-quotes', () => {
  it('url-references-with-quotes', async () => {
    const { svgElement, width, height } = await loadSvg(
      '/test/url-references-with-quotes/url-references-with-quotes.svg'
    )
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./url-references-with-quotes.pdf')
  })
})
