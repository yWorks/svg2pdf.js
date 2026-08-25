import { describe, it, expect } from 'vitest'
import { svg2pdf } from '../../src/svg2pdf'
import jsPDF from 'jspdf'
import { loadSvg } from '../utils/loadSvg'

describe('custom-fonts', () => {
  it('custom-fonts', async () => {
    const { svgElement, width, height } = await loadSvg('/test/custom-fonts/custom-fonts.svg')
    const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])
    const fontData = await fetch('/test/custom-fonts/Batang.ttf')
      .then(r => r.arrayBuffer())
      .then(buffer => {
        const bytes = new Uint8Array(buffer)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        return binary
      })
    pdf.addFileToVFS('/test/custom-fonts/Batang.ttf', fontData)
    pdf.addFont('/test/custom-fonts/Batang.ttf', 'Batang', 'normal')

    await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
    await expect(pdf.output('arraybuffer')).toMatchPdfSnapshot('./custom-fonts.pdf')
  })
})
