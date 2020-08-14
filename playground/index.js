const { jsPDF } = window.jspdf
const DOMPurify = window.DOMPurify

const defaultSample = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 150">
  <text x="20" y="20">Hello, world!</text>
</svg>`

const editor = CodeMirror(document.getElementById('editor'), {
  lineNumbers: true,
  mode: 'xml'
})

const doc = editor.getDoc()

window.addEventListener('load', () => {
  const url = new URL(window.location)
  const editorText = url.searchParams.get('svg')
  if (editorText) {
    doc.setValue(decodeURIComponent(editorText))
  } else {
    doc.setValue(defaultSample)
  }
})

editor.on(
  'change',
  debounce(() => {
    const svgText = DOMPurify.sanitize(doc.getValue())
    updateUrl(svgText)
    updateIssueLinks()
    updateSvg(svgText)
    updatePdf()
  })
)

function debounce(f) {
  let timeout
  return () => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      f()
      timeout = undefined
    }, 100)
  }
}

function updateUrl(svgText) {
  const url = new URL(window.location)
  url.searchParams.set('svg', encodeURIComponent(svgText))
  window.history.replaceState(undefined, '', url.toString())
}

function updateIssueLinks() {
  const issueBody = `**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
See this [playground](${window.location.href}).

**Expected behavior**
I would have expected the PDF to look like so. 
This is in accordance to the following SVG spec.

**Desktop (please complete the following information):**
 - OS: [e.g. iOS]
 - Browser [e.g. chrome, safari]
 - Version [e.g. 22]

**Smartphone (please complete the following information):**
 - Device: [e.g. iPhone6]
 - OS: [e.g. iOS8.1]
 - Browser [e.g. stock browser, safari]
 - Version [e.g. 22]

**Additional context**
Add any other context about the problem here.
`
  const target = `https://github.com/yWorks/svg2pdf.js/issues/new?body=${encodeURIComponent(
    issueBody
  )}`
  const links = document.getElementsByClassName('issue-link')
  for (let i = 0; i < links.length; i++) {
    links[i].setAttribute('href', target)
  }
}

function updateSvg(svgText) {
  document.getElementById('svg-container').innerHTML = svgText
}

async function updatePdf() {
  const svgElement = document.getElementById('svg-container').firstElementChild
  svgElement.getBoundingClientRect() // force layout calculation
  const width = svgElement.width.baseVal.value
  const height = svgElement.height.baseVal.value
  const pdf = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])

  await pdf.svg(svgElement, { width, height })

  document.getElementById('pdf-iframe').setAttribute('src', pdf.output('datauristring'))
}
