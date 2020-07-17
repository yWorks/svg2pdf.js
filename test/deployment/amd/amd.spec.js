const debug = false

require.config({
  baseUrl: '/base',
  paths: {
    svg2pdf: 'dist/svg2pdf.umd',
    jspdf: 'node_modules/jspdf/dist/jspdf.umd'
  }
})

describe('Modules should be loaded by AMD', () => {
  it('jsPDF/svg2pdf', async () => {
    await new Promise(resolve => {
      require(['jspdf', 'svg2pdf'], (jspdf, svg2pdf) => {
        expect(jspdf).to.be.ok
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
        require(['jspdf', 'svg2pdf'], (jspdf, svg2pdf) => {
          const width = svgElement.width.baseVal.value
          const height = svgElement.height.baseVal.value
          const pdf = new jspdf.jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])

          if (name === 'custom-fonts') {
            const filename = '/base/test/specs/custom-fonts/Batang.ttf'
            const fontData = window.loadBinaryResource(filename)
            pdf.addFileToVFS(filename, fontData)
            pdf.addFont(filename, 'Batang', 'normal')
          }

          // await svg2pdf(svgElement, pdf, { loadExternalStyleSheets: true })
          pdf
            .svg(svgElement, { loadExternalStyleSheets: true })
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
