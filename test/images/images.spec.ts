import { describe, it, expect, vi, afterEach } from 'vitest'
import { svg2pdf } from '../../src/svg2pdf'
import jsPDF from 'jspdf'
import { loadSvg } from '../utils/loadSvg'
import { ImageNode } from '../../src/nodes/image'

describe('images', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

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

  it('does not load images when disabled', async () => {
    const fetchImageData = vi.spyOn(ImageNode, 'fetchImageData')
    const svgElement = createSvg('data:image/png;base64,AAAA')

    await svg2pdf(svgElement, createPdf(), { loadImages: false })

    expect(fetchImageData).not.toHaveBeenCalled()
  })

  it('loads only raw hrefs matching the image URL expression', async () => {
    const fetchImageData = vi
      .spyOn(ImageNode, 'fetchImageData')
      .mockResolvedValue({ data: '', format: 'png' })
    const svgElement = new DOMParser().parseFromString(
      '<svg xmlns="http://www.w3.org/2000/svg"><image href="data:image/png;base64,AAAA" /><image href="other.png" /></svg>',
      'image/svg+xml'
    ).documentElement as unknown as SVGElement

    await svg2pdf(svgElement, createPdf(), { loadImages: /^data:/ })

    expect(fetchImageData).toHaveBeenCalledTimes(1)
    expect(fetchImageData).toHaveBeenCalledWith('data:image/png;base64,AAAA')
  })
})

function createSvg(imageHref: string): SVGElement {
  return new DOMParser().parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><image href="${imageHref}" width="100" height="100" /></svg>`,
    'image/svg+xml'
  ).documentElement as unknown as SVGElement
}

function createPdf(): jsPDF {
  return new jsPDF('p', 'pt', [100, 100])
}
