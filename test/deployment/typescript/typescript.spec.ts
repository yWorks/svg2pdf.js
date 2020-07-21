// import { svg2pdf } from '../../../dist/svg2pdf.es'
import '../../../dist/svg2pdf.es'
import jsPDF from 'jspdf'

declare global {
  interface Window {
    tests: string[]
    loadSvg(url: string): string
    loadBinaryResource(url: string): string
  }
  function describe(name: string, fn: () => any): void
  function it(name: string, fn: () => any): void
  function comparePdf(pdf: string, fileName: string, debug: boolean): void
}

const debug = false

for (const test of window.tests) {
  let name: string, jsPDFOptions: number[], svg2pdfOptions: any
  if (Array.isArray(test)) {
    ;[name, jsPDFOptions, svg2pdfOptions] = test
  } else {
    name = test
    jsPDFOptions = undefined
    svg2pdfOptions = { loadExternalStyleSheets: true }
  }
  describe(name, function() {
    this.timeout(5000)
    const svgText = window.loadSvg(`/base/test/specs/${name}/spec.svg`)
    const parser = new DOMParser()
    const svgElement = parser.parseFromString(svgText, 'image/svg+xml')
      .firstElementChild as HTMLElement

    it(`testing ${name}`, async function() {
      const width = jsPDFOptions ? jsPDFOptions[0] : (svgElement as any).width.baseVal.value
      const height = jsPDFOptions ? jsPDFOptions[1] : (svgElement as any).height.baseVal.value
      const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])

      if (name === 'custom-fonts') {
        const filename = '/base/test/specs/custom-fonts/Batang.ttf'
        const fontData = window.loadBinaryResource(filename)
        pdf.addFileToVFS(filename, fontData)
        pdf.addFont(filename, 'Batang', 'normal')
      }

      await pdf.svg(svgElement, svg2pdfOptions)
      // await svg2pdf(svgElement, pdf, svg2pdfOptions)

      comparePdf(pdf.output(), `/test/specs/${name}/reference.pdf`, debug)
    })
  })
}
