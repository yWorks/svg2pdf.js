import { describe, it, expect } from 'vitest'
import { svg2pdf } from '../../src/svg2pdf'
import jsPDF from 'jspdf'
import { loadSvg } from '../utils/loadSvg'

describe('path-arc-support', () => {
  it('path-arc-support', async () => {
    const { svgElement, width, height } = await loadSvg(
      '/test/path-arc-support/path-arc-support.svg'
    )
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./path-arc-support.pdf')
  })
})
