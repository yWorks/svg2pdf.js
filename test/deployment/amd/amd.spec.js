const debug = false

require.config({
  baseUrl: '/base',
  paths: {
    svg2pdf: 'dist/svg2pdf',
    'jspdf': 'node_modules/jspdf'
  }
})

describe('Modules should be loaded by AMD', () => {
  it('jsPDF/svg2pdf', async () => {
    await new Promise(resolve => {
      require(['jspdf/dist/jspdf.umd', 'svg2pdf'], (jsPDF, svg2pdf) => {
        expect(jsPDF).to.be.ok
        expect(svg2pdf).to.be.ok
        resolve()
      })
    })
  })
})

for (const name of window.tests) {
  describe(name, () => {
    const svgText = window.loadSvg(`/base/test/specs/${name}/spec.svg`)
    const parser = new DOMParser()
    const svgElement = parser.parseFromString(svgText, 'image/svg+xml').firstElementChild

    it(`testing ${name}`, async () => {
      await new Promise((resolve, reject) => {
        require(['jspdf/dist/jspdf.umd', 'svg2pdf'], (jsPDF, svg2pdf) => {
          const width = svgElement.width.baseVal.value
          const height = svgElement.height.baseVal.value
          const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])

          // await svg2pdf(svgElement, pdf, {})
          pdf
            .svg(svgElement)
            .then(pdf => {
              comparePdf(pdf.output(), `/test/specs/${name}/reference.pdf`, debug)
            })
            .then(resolve)
            .catch(reject)
        })
      })
    })
  })
}
