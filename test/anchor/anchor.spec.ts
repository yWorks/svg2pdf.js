import { describe, it, expect, vi } from 'vitest'
import { svg2pdf } from '../../src/svg2pdf'
import jsPDF from 'jspdf'
import { loadSvg } from '../utils/loadSvg'

describe('anchor', () => {
  it('anchor', async () => {
    const { svgElement, width, height } = await loadSvg('/test/anchor/anchor.svg')
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })

    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./anchor.pdf')
  })

  it('aligns rectangular link hitboxes with their SVG bounds', async () => {
    const { svgElement, width, height } = await loadSvg('/test/anchor/rect-link.svg')
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    const link = vi.spyOn(pdf, 'link')
    await svg2pdf(svgElement, pdf)

    const rectHitbox = link.mock.calls.find(
      ([, , , , options]) => options.url === 'https://example.com/hitbox'
    )
    expect(rectHitbox).toBeDefined()
    expect(rectHitbox?.slice(0, 4)).toEqual([180, 190, 100, 100])
  })

  it('preserves text link hitboxes while normalizing text bounds', async () => {
    const { svgElement, width, height } = await loadSvg('/test/anchor/anchor.svg')
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    const link = vi.spyOn(pdf, 'link')
    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })

    const textHitbox = link.mock.calls.find(
      ([, , , , options]) =>
        options.url ===
        'https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/dominant-baseline#hanging'
    )
    expect(textHitbox).toBeDefined()
    expect(textHitbox?.[1]).toBeCloseTo(277)
    expect(textHitbox?.[3]).toBe(30)
  })
})
