const { svg2pdf } = require('../../../dist/svg2pdf.umd')
const { jsPDF } = require('jspdf')

const debug = false

for (const name of window.tests) {
  describe(name, function() {
    this.timeout(5000)
    const svgText = window.loadSvg(`/base/test/specs/${name}/spec.svg`)
    const parser = new DOMParser()
    const svgElement = parser.parseFromString(svgText, 'image/svg+xml').firstElementChild

    it(`testing ${name}`, async function() {
      const width = svgElement.width.baseVal.value
      const height = svgElement.height.baseVal.value
      const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])

      if (name === 'custom-fonts') {
        const filename = '/base/test/specs/custom-fonts/Batang.ttf'
        const fontData = window.loadBinaryResource(filename)
        pdf.addFileToVFS(filename, fontData)
        pdf.addFont(filename, 'Batang', 'normal')
      }

      await pdf.svg(svgElement, { loadExternalStyleSheets: true })
      // await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })

      comparePdf(pdf.output(), `/test/specs/${name}/reference.pdf`, debug)
    })
  })
}
