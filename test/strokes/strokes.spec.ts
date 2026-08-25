import { describe, it, expect } from 'vitest'
import { svg2pdf } from '../../src/svg2pdf'
import jsPDF from 'jspdf'
import { loadSvg } from '../utils/loadSvg'

describe('strokes', () => {
  it('strokes-and-bounding-boxes', async () => {
    const { svgElement, width, height } = await loadSvg(
      '/test/strokes/strokes-and-bounding-boxes.svg'
    )
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./strokes-and-bounding-boxes.pdf')
  })

  it('zero-width-strokes', async () => {
    const { svgElement, width, height } = await loadSvg('/test/strokes/zero-width-strokes.svg')
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./zero-width-strokes.pdf')
  })

  it('zero-width-strokes-text', async () => {
    const { svgElement, width, height } = await loadSvg('/test/strokes/zero-width-strokes-text.svg')
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./zero-width-strokes-text.pdf')
  })
})
