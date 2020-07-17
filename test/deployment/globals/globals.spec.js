const debug = false

const jsPDF = window.jspdf.jsPDF
const svg2pdf = window.svg2pdf

describe('Globals should be available', () => {
  it('jsPDF', () => {
    expect(jsPDF).to.be.ok
  })
  it('svg2pdf', () => {
    expect(svg2pdf).to.be.ok
  })
})

for (const name of window.tests) {
  describe(name, function() {
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
