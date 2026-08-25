import { describe, it, expect } from 'vitest'
import { svg2pdf } from '../../src/svg2pdf'
import jsPDF from 'jspdf'
import { loadSvg } from '../utils/loadSvg'

describe('line-default-coordinates', () => {
  it('line-default-coordinates', async () => {
    const { svgElement, width, height } = await loadSvg(
      '/test/line-default-coordinates/line-default-coordinates.svg'
    )
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./line-default-coordinates.pdf')
  })
})
