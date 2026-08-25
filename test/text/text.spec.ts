import { describe, it, expect } from 'vitest'
import { svg2pdf } from '../../src/svg2pdf'
import jsPDF from 'jspdf'
import { loadSvg } from '../utils/loadSvg'

describe('text', () => {
  it('text-fill-stroke', async () => {
    const { svgElement, width, height } = await loadSvg('/test/text/text-fill-stroke.svg')
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./text-fill-stroke.pdf')
  })

  it('text-placement', async () => {
    const { svgElement, width, height } = await loadSvg('/test/text/text-placement.svg')
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./text-placement.pdf')
  })

  it('nested-tspans', async () => {
    const { svgElement, width, height } = await loadSvg('/test/text/nested-tspans.svg')
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./nested-tspans.pdf')
  })

  it('text-length', async () => {
    const { svgElement, width, height } = await loadSvg('/test/text/text-length.svg')
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./text-length.pdf')
  })
})
