const debug = false;

const tests = [
    "attribute-style-precedence",
    "clippath",
    "complete-bpmn",
    "complete-computer-network",
    "complete-dependency-diagram",
    "complete-diagram1",
    "complete-diagram2",
    "complete-dropshadows",
    "complete-flowchart1",
    "complete-flowchart2",
    "complete-social-network",
    "complete-movies",
    "complete-organization-chart",
    "complete-organization-chart-new",
    "display-none-and-visibility-inheritance",
    "fill-and-stroke-inheritance",
    "fill-and-stroke-opacity",
    "font-family-attribute",
    "font-style",
    "gradient-default-coordinates",
    "gradient-percent-offset",
    "gradient-units",
    "gradients-and-patterns-mixed",
    "hidden-clippath",
    "image-svg-urls",
    "line-default-coordinates",
    "markers",
    "opacity-and-rgba",
    "path-arc-support",
    "patterns",
    "polyline",
    "references",
    "remote-images",
    "strokes-and-bounding-boxes",
    "text-placement",
    "title-element",
    "transparent-pngs",
    "url-references-with-quotes",
    "zero-width-strokes",
    "xml-space"
];

for (let name of tests) {

  describe(name, function () {
    const svgText = loadSvg(`/base/tests/${name}/spec.svg`);
    const parser = new DOMParser();
    const svgElement = parser.parseFromString(svgText, "image/svg+xml").firstElementChild;

    it(`testing ${name}`, function () {
      const width = svgElement.width.baseVal.value;
      const height = svgElement.height.baseVal.value;
      const pdf = new jsPDF(width > height ? "l" : "p", 'pt', [width, height]);

      svg2pdf(svgElement, pdf, {});

      comparePdf(pdf.output(), `/tests/${name}/reference.pdf`, debug);
    })
  });
}

function loadSvg(url) {
  const request = new XMLHttpRequest();
  request.open('GET', url, false);
  request.overrideMimeType('text\/plain; charset=x-user-defined');
  request.send();

  if (request.status !== 200) {
    throw new Error(`Unable to fetch ${url}, status code: ${request.status}`);
  }

  return request.responseText;
}
