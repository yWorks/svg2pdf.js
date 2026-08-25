import { describe, it, expect } from 'vitest'
import { svg2pdf } from '../../src/svg2pdf'
import jsPDF from 'jspdf'
import { loadSvg } from '../utils/loadSvg'

describe('fill-and-stroke', () => {
  it('fill-and-stroke-inheritance', async () => {
    const { svgElement, width, height } = await loadSvg(
      '/test/fill-and-stroke/fill-and-stroke-inheritance.svg'
    )
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./fill-and-stroke-inheritance.pdf')
  })

  it('fill-and-stroke-opacity', async () => {
    const { svgElement, width, height } = await loadSvg(
      '/test/fill-and-stroke/fill-and-stroke-opacity.svg'
    )
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./fill-and-stroke-opacity.pdf')
  })

  it('fill-and-stroke-rgba', async () => {
    const { svgElement, width, height } = await loadSvg(
      '/test/fill-and-stroke/fill-and-stroke-rgba.svg'
    )
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./fill-and-stroke-rgba.pdf')
  })

  it('fill-rule', async () => {
    const { svgElement, width, height } = await loadSvg('/test/fill-and-stroke/fill-rule.svg')
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./fill-rule.pdf')
  })

  it('group-fill-rule', async () => {
    const { svgElement, width, height } = await loadSvg('/test/fill-and-stroke/group-fill-rule.svg')
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./group-fill-rule.pdf')
  })
})
