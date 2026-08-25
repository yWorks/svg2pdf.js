import { describe, it, expect } from 'vitest'
import { svg2pdf } from '../../src/svg2pdf'
import jsPDF from 'jspdf'
import { loadSvg } from '../utils/loadSvg'

describe('images', () => {
  it('image-aspect-ratio', async () => {
    const { svgElement, width, height } = await loadSvg('/test/images/image-aspect-ratio.svg')
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./image-aspect-ratio.pdf')
  })

  it('image-data-urls-base64-spaces', async () => {
    const { svgElement, width, height } = await loadSvg(
      '/test/images/image-data-urls-base64-spaces.svg'
    )
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot(
      './image-data-urls-base64-spaces.pdf'
    )
  })

  it('image-svg-urls', async () => {
    const { svgElement, width, height } = await loadSvg('/test/images/image-svg-urls.svg')
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./image-svg-urls.pdf')
  })

  it('remote-images', async () => {
    const { svgElement, width, height } = await loadSvg('/test/images/remote-images.svg')
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./remote-images.pdf')
  })

  it('transparent-pngs', async () => {
    const { svgElement, width, height } = await loadSvg('/test/images/transparent-pngs.svg')
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./transparent-pngs.pdf')
  })
})
