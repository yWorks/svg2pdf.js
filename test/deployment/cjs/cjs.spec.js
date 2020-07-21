const { svg2pdf } = require('../../../dist/svg2pdf.umd')
const { jsPDF } = require('jspdf')

const debug = false

for (const test of window.tests) {
  let name, jsPDFOptions, svg2pdfOptions
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
    const svgElement = parser.parseFromString(svgText, 'image/svg+xml').firstElementChild

    it(`testing ${name}`, async function() {
      const width = jsPDFOptions ? jsPDFOptions[0] : svgElement.width.baseVal.value
      const height = jsPDFOptions ? jsPDFOptions[1] : svgElement.height.baseVal.value
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
