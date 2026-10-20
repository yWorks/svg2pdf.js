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

  it('zero-dasharray', async () => {
    const { svgElement, width, height } = await loadSvg('/test/strokes/zero-dasharray.svg')
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    const buffer = pdf.output('arraybuffer')
    // All-zero dash arrays must not be written into the PDF content stream.
    const content = new TextDecoder('latin1').decode(buffer)
    expect(content).not.toMatch(/(?:^|[^\d.])0(?:\.0+)?\s+0(?:\.0+)?\s+d\b/m)
    await expect(buffer).toMatchPdfSnapshot('./zero-dasharray.pdf')
  })
})
