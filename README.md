# svg2pdf.js

[![NPM version](https://img.shields.io/npm/v/svg2pdf.js.svg?style=flat)](https://www.npmjs.org/package/svg2pdf.js)

A JavaScript-only utility for converting SVG to PDF in the browser using jsPDF.

Try it in the [online playground](http://raw.githack.com/yWorks/svg2pdf.js/master/).

## Installation

You can install svg2pdf.js via npm:

```sh
npm install svg2pdf.js jspdf
```

If you want to use a development version from the repository, note that the files in `dist` may reflect the latest
release rather than the current source. A simple `package.json` dependency pointing to a branch or revision may
therefore fail.
See [#102](https://github.com/yWorks/svg2pdf.js/issues/102) for details.

## Usage

```js
import { jsPDF } from 'jspdf'
import 'svg2pdf.js'

const doc = new jsPDF(width > height ? 'l' : 'p', 'pt', [width, height])

const element = document.getElementById('svg')
await doc.svg(element, {
  x,
  y,
  width,
  height
})

// save the created pdf
doc.save('myPDF.pdf')
```

See the [TypeScript declaration file](https://github.com/yWorks/svg2pdf.js/blob/master/types.d.ts) for detailed
documentation.

## Custom Fonts and Non-ASCII Characters

If you want to use fonts or characters beyond the basic set, you must add them before calling `svg2pdf`.

See the [jsPDF README](https://github.com/MrRio/jsPDF) for instructions.

## Purpose and Security

This library is intended to convert carefully curated SVG images to PDF. It supports only a limited part of the SVG
specification and cannot convert arbitrary user-provided SVGs. It requires a fully functional DOM implementation and
does not work with JSDOM. The library is designed to run client-side in the user's browser. Although it can also run
in a headless browser on the backend, it cannot guarantee security. Always sanitize any user-provided SVG, including
user-provided fragments, before passing it to the library, and properly sandbox its execution.

## Reporting issues

If something does not work as expected, please submit an
[issue report](https://github.com/yWorks/svg2pdf.js/issues). To help us investigate efficiently, include the
[necessary information](https://github.com/yWorks/svg2pdf.js/blob/master/CONTRIBUTING.md#reporting-bugs).

Please stick to our [Code of Conduct](https://github.com/yWorks/svg2pdf.js/blob/master/CODE_OF_CONDUCT.md).

## Building

To work with the source or build the minified JavaScript files yourself, check out the repository and use the npm
scripts defined in `package.json`:

```bash
npm run build
```

### Testing

Run the tests with:

```sh
npm test
```

Tests are located in the `tests` folder. Most compare generated PDFs with snapshots. To update existing snapshots, run
`npm run test:update`, then carefully review the updated PDFs.

Some tests may fail on your local machine because of differences in text measurement. If you are contributing to a
pull request and need to update the snapshots, download the relevant artifact from the CI build job on GitHub and
commit it in a subsequent commit.

## Dependencies

- [jsPDF](https://github.com/MrRio/jsPDF)
- [svgpath](https://github.com/fontello/svgpath)
- [cssesc](https://github.com/mathiasbynens/cssesc)
- [font-family-papandreou](https://github.com/hanamura/font-family)
- [specificity](https://github.com/keeganstreet/specificity)

## License

The MIT License (MIT)

Copyright (c) 2015-2026 yWorks GmbH

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
