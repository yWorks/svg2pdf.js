import { svg2pdf } from '../../../dist/svg2pdf.esm'
import jsPDF from 'jspdf-yworks/dist/jspdf.node.debug'

declare global {
  interface Window {
    tests: string[]
    loadSvg(url: string)
  }
  function describe(name: string, fn: () => any)
  function it(name: string, fn: () => any)
  function comparePdf(pdf: string, fileName: string, debug: boolean)
}

const debug = false

for (const name of window.tests) {
  describe(name, function() {
    const svgText = window.loadSvg(`/base/test/specs/${name}/spec.svg`)
    const parser = new DOMParser()
    const svgElement = parser.parseFromString(svgText, 'image/svg+xml').firstElementChild

    it(`testing ${name}`, async function() {
      const width = (svgElement as any).width.baseVal.value
      const height = (svgElement as any).height.baseVal.value
      const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])

      await pdf.svg(svgElement)
      // await svg2pdf(svgElement, pdf, {})

      comparePdf(pdf.output(), `/test/specs/${name}/reference.pdf`, debug)
    })
  })
}
