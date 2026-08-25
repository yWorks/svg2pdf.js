import { describe, it, expect } from 'vitest'
import { svg2pdf } from '../../src/svg2pdf'
import jsPDF from 'jspdf'
import { loadSvg } from '../utils/loadSvg'

describe('svg-use-empty', () => {
  it('svg-use-empty', async () => {
    const { svgElement, width, height } = await loadSvg('/test/svg-use-empty/svg-use-empty.svg')
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./svg-use-empty.pdf')
  })
})
