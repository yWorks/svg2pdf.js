import { describe, it, expect } from 'vitest'
import { svg2pdf } from '../../src/svg2pdf'
import jsPDF from 'jspdf'
import { loadSvg } from '../utils/loadSvg'

describe('gradients', () => {
  it('gradient-default-coordinates', async () => {
    const { svgElement, width, height } = await loadSvg(
      '/test/gradients/gradient-default-coordinates.svg'
    )
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./gradient-default-coordinates.pdf')
  })

  it('gradient-percent-offset', async () => {
    const { svgElement, width, height } = await loadSvg(
      '/test/gradients/gradient-percent-offset.svg'
    )
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./gradient-percent-offset.pdf')
  })

  it('gradient-stop-defaults', async () => {
    const { svgElement, width, height } = await loadSvg(
      '/test/gradients/gradient-stop-defaults.svg'
    )
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./gradient-stop-defaults.pdf')
  })

  it('gradient-units', async () => {
    const { svgElement, width, height } = await loadSvg('/test/gradients/gradient-units.svg')
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./gradient-units.pdf')
  })
})
