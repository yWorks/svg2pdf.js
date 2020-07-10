const { svg2pdf } = require('../../../dist/svg2pdf.node')
const jsPDF = require('jspdf')

const debug = false

for (const name of window.tests) {
  describe(name, function() {
    const svgText = window.loadSvg(`/base/test/specs/${name}/spec.svg`)
    const parser = new DOMParser()
    const svgElement = parser.parseFromString(svgText, 'image/svg+xml').firstElementChild

    it(`testing ${name}`, async function() {
      const width = svgElement.width.baseVal.value
      const height = svgElement.height.baseVal.value
      const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])

      await pdf.svg(svgElement)
      // await svg2pdf(svgElement, pdf, {})

      comparePdf(pdf.output(), `/test/specs/${name}/reference.pdf`, debug)
    })
  })
}
