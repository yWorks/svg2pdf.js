const tests = [
    "display-none-and-visibility-inheritance",
    "fill-and-stroke-inheritance",
    "fill-and-stroke-opacity",
    "gradient-default-coordinates",
    "gradients-and-patterns-mixed",
    "line-default-coordinates",
    "markers",
    "opacity-and-rgba",
    "path-arg-support",
    "strokes-and-bounding-boxes",
    "text-placement",
    "transparent-pngs",
    "zero-width-strokes"
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

      comparePdf(pdf.output(), `/tests/${name}/reference.pdf`);
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
