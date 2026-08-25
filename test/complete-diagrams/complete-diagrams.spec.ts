import { describe, it, expect } from 'vitest'
import { svg2pdf } from '../../src/svg2pdf'
import jsPDF from 'jspdf'
import { loadSvg } from '../utils/loadSvg'

describe('complete-diagrams', () => {
  it('complete-bpmn', async () => {
    const { svgElement, width, height } = await loadSvg('/test/complete-diagrams/complete-bpmn.svg')
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./complete-bpmn.pdf')
  })

  it('complete-computer-network', async () => {
    const { svgElement, width, height } = await loadSvg(
      '/test/complete-diagrams/complete-computer-network.svg'
    )
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./complete-computer-network.pdf')
  })

  it('complete-dependency-diagram', async () => {
    const { svgElement, width, height } = await loadSvg(
      '/test/complete-diagrams/complete-dependency-diagram.svg'
    )
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./complete-dependency-diagram.pdf')
  })

  it('complete-diagram1', async () => {
    const { svgElement, width, height } = await loadSvg(
      '/test/complete-diagrams/complete-diagram1.svg'
    )
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./complete-diagram1.pdf')
  })

  it('complete-diagram2', async () => {
    const { svgElement, width, height } = await loadSvg(
      '/test/complete-diagrams/complete-diagram2.svg'
    )
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./complete-diagram2.pdf')
  })

  it('complete-dropshadows', async () => {
    const { svgElement, width, height } = await loadSvg(
      '/test/complete-diagrams/complete-dropshadows.svg'
    )
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./complete-dropshadows.pdf')
  })

  it('complete-flowchart1', async () => {
    const { svgElement, width, height } = await loadSvg(
      '/test/complete-diagrams/complete-flowchart1.svg'
    )
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./complete-flowchart1.pdf')
  })

  it('complete-flowchart2', async () => {
    const { svgElement, width, height } = await loadSvg(
      '/test/complete-diagrams/complete-flowchart2.svg'
    )
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./complete-flowchart2.pdf')
  })

  it('complete-movies', async () => {
    const { svgElement, width, height } = await loadSvg(
      '/test/complete-diagrams/complete-movies.svg'
    )
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./complete-movies.pdf')
  })

  it('complete-organization-chart', async () => {
    const { svgElement, width, height } = await loadSvg(
      '/test/complete-diagrams/complete-organization-chart.svg'
    )
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./complete-organization-chart.pdf')
  })

  it('complete-organization-chart-new', async () => {
    const { svgElement, width, height } = await loadSvg(
      '/test/complete-diagrams/complete-organization-chart-new.svg'
    )
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot(
      './complete-organization-chart-new.pdf'
    )
  })

  it('complete-social-network', async () => {
    const { svgElement, width, height } = await loadSvg(
      '/test/complete-diagrams/complete-social-network.svg'
    )
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./complete-social-network.pdf')
  })
})
