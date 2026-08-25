import { describe, it, expect } from 'vitest'
import { svg2pdf } from '../../src/svg2pdf'
import jsPDF from 'jspdf'
import { loadSvg } from '../utils/loadSvg'

describe('patterns', () => {
  it('pattern-units', async () => {
    const { svgElement, width, height } = await loadSvg('/test/patterns/pattern-units.svg')
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./pattern-units.pdf')
  })

  it('patterns', async () => {
    const { svgElement, width, height } = await loadSvg('/test/patterns/patterns.svg')
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./patterns.pdf')
  })

  it('gradients-and-patterns-mixed', async () => {
    const { svgElement, width, height } = await loadSvg(
      '/test/patterns/gradients-and-patterns-mixed.svg'
    )
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./gradients-and-patterns-mixed.pdf')
  })
})
