import { describe, it, expect } from 'vitest'
import { svg2pdf } from '../../src/svg2pdf'
import jsPDF from 'jspdf'
import { loadSvg } from '../utils/loadSvg'

describe('clippath', () => {
  it('clippath', async () => {
    const { svgElement, width, height } = await loadSvg('/test/clippath/clippath.svg')
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./clippath.pdf')
  })

  it('clippath-cliprule', async () => {
    const { svgElement, width, height } = await loadSvg('/test/clippath/clippath-cliprule.svg')
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./clippath-cliprule.pdf')
  })

  it('clippath-empty', async () => {
    const { svgElement, width, height } = await loadSvg('/test/clippath/clippath-empty.svg')
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./clippath-empty.pdf')
  })

  it('clippath-svg', async () => {
    const { svgElement, width, height } = await loadSvg('/test/clippath/clippath-svg.svg')
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./clippath-svg.pdf')
  })

  it('hidden-clippath', async () => {
    const { svgElement, width, height } = await loadSvg('/test/clippath/hidden-clippath.svg')
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./hidden-clippath.pdf')
  })
})
