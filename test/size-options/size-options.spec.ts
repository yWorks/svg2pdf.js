import { describe, it, expect } from 'vitest'
import { svg2pdf } from '../../src/svg2pdf'
import jsPDF from 'jspdf'
import { loadSvg } from '../utils/loadSvg'

describe('size-options', () => {
  it('no-params-no-attrs-no-viewbox', async () => {
    const { svgElement } = await loadSvg('/test/size-options/no-params-no-attrs-no-viewbox.svg')
    const pdf = new jsPDF('l', 'pt', [400, 300])
    await svg2pdf(svgElement, pdf, {})
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot(
      './no-params-no-attrs-no-viewbox.pdf'
    )
  })

  it('no-params-no-attrs-with-viewbox', async () => {
    const { svgElement } = await loadSvg('/test/size-options/no-params-no-attrs-with-viewbox.svg')
    const pdf = new jsPDF('l', 'pt', [400, 300])
    await svg2pdf(svgElement, pdf, {})
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot(
      './no-params-no-attrs-with-viewbox.pdf'
    )
  })

  it('no-params-with-attrs-no-viewbox', async () => {
    const { svgElement } = await loadSvg('/test/size-options/no-params-with-attrs-no-viewbox.svg')
    const pdf = new jsPDF('l', 'pt', [400, 300])
    await svg2pdf(svgElement, pdf, {})
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot(
      './no-params-with-attrs-no-viewbox.pdf'
    )
  })

  it('no-params-with-attrs-with-viewbox', async () => {
    const { svgElement } = await loadSvg('/test/size-options/no-params-with-attrs-with-viewbox.svg')
    const pdf = new jsPDF('l', 'pt', [400, 300])
    await svg2pdf(svgElement, pdf, {})
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot(
      './no-params-with-attrs-with-viewbox.pdf'
    )
  })

  it('no-params-with-height-with-viewbox', async () => {
    const { svgElement } = await loadSvg(
      '/test/size-options/no-params-with-height-with-viewbox.svg'
    )
    const pdf = new jsPDF('l', 'pt', [400, 300])
    await svg2pdf(svgElement, pdf, {})
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot(
      './no-params-with-height-with-viewbox.pdf'
    )
  })

  it('no-params-with-width-with-viewbox', async () => {
    const { svgElement } = await loadSvg('/test/size-options/no-params-with-width-with-viewbox.svg')
    const pdf = new jsPDF('l', 'pt', [400, 300])
    await svg2pdf(svgElement, pdf, {})
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot(
      './no-params-with-width-with-viewbox.pdf'
    )
  })

  it('with-params-with-attrs-with-viewbox', async () => {
    const { svgElement } = await loadSvg(
      '/test/size-options/with-params-with-attrs-with-viewbox.svg'
    )
    const pdf = new jsPDF('l', 'pt', [400, 300])
    await svg2pdf(svgElement, pdf, { width: 250, height: 200 })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot(
      './with-params-with-attrs-with-viewbox.pdf'
    )
  })
})
