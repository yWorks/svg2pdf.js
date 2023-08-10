# svg2pdf.js

[![NPM version](https://img.shields.io/npm/v/svg2pdf.js.svg?style=flat)](https://www.npmjs.org/package/svg2pdf.js) ![Continous Integration for svg2pdf.js](https://github.com/yWorks/svg2pdf.js/workflows/Continous%20Integration%20for%20svg2pdf.js/badge.svg)

A javascript-only SVG to PDF conversion utility that runs in the browser leveraging jsPDF.

Give it a trial: [online playground](http://raw.githack.com/yWorks/svg2pdf.js/master/).

## Installation

You can get svg2pf.js via npm:

```sh
npm install svg2pdf.js jspdf --save
# or
yarn add svg2pdf.js jspdf
```

Since version 2.x, this repository no longer depends on a forked jsPDF but can be used with original
[MrRio/jsPDF](https://github.com/MrRio/jsPDF).

If you want to use a development version from the repository, pay attention to the fact that the files in dist may
reflect the last release version. So a simple package.json dependency link to the branch or revision will fail.
See [#102](https://github.com/yWorks/svg2pdf.js/issues/102) for details.

## Usage

```js
import { jsPDF } from 'jspdf'
import 'svg2pdf.js'

const doc = new jsPDF()

const element = document.getElementById('svg')
doc
  .svg(element, {
    x,
    y,
    width,
    height
  })
  .then(() => {
    // save the created pdf
    doc.save('myPDF.pdf')
  })
```

Have a look at the [typings file](https://github.com/yWorks/svg2pdf.js/blob/master/types.d.ts) for
detailed documentation.

### Other module formats

Importing is also possible via [requirejs](http://requirejs.org/):

```javascript
require.config({
  baseUrl: './node_modules'
});
require([
  'svg2pdf.js/dist/svg2pdf.umd.min',
  'jspdf/dist/jspdf.umd.min'
], (svg2pdf, jsPDF) => {...});
```

or script-tag:

```html
<script src="[node_modules|bower_components]/jspdf/dist/jspdf.umd.min.js"></script>
<script src="[node_modules|bower_components]/svg2pdf.js/dist/svg2pdf.umd.min.js"></script>
```

## Concerning custom fonts and non US-ASCII characters

If you want to use other than really basic fonts and characters you _have to_ add them first before calling `svg2pdf`:

Please refer to the [jsPDF readme](https://github.com/MrRio/jsPDF).

## Reporting issues

Svg2pdf is by no means perfect. If you find something is not working as expected we are glad to receive an
[issue report](https://github.com/yWorks/svg2pdf.js/issues) from you. In order to be able to react efficiently we ask
you to provide us with the [necessary information](https://github.com/yWorks/svg2pdf.js/blob/master/CONTRIBUTING.md#reporting-bugs).

Please stick to our [Code of Conduct](https://github.com/yWorks/svg2pdf.js/blob/master/CODE_OF_CONDUCT.md).

## Building

If you want to play with the sources or build the minified js file yourself, check out the repository and use the npm scripts defined in `package.json`:

```bash
npm run build
```

### Testing

The `test` folder contains a set of unit tests. Each unit test has its own folder and contains exactly two files:

- A `spec.svg` file that contains the svg to test
- A `reference.pdf` file that is generated automatically and serves as reference for regression testing

You can run the tests using

```sh
npm run createreferences && npm run test-unit
```

The tests use the [Karma](https://karma-runner.github.io/5.2/index.html) framework and run in a captured (headless) browser.

The `createreferences` script starts a server that automatically saves reference PDFs if they don't already exist.
You can omit this command if you just want to test for regression.

If you're debugging and want to have visual feedback, you should switch the `debug` flag to `true` in `test/unit/all.spec.js`.
This ensures that a new reference PDF will be created on every run. You might also want to disable some tests in
the `test/common/tests` array.

Some tests might fail on your local machine, because of differences in text measuring. If you're contributing to
a pull request and need to update the reference files, download the respective artifact from the CI build job on
GitHub and check it in in a subsequent commit.

## Dependencies

- [jsPDF](https://github.com/MrRio/jsPDF)
- [svgpath](https://github.com/fontello/svgpath)
- [cssesc](https://github.com/mathiasbynens/cssesc)
- [font-family-papandreou](https://github.com/hanamura/font-family)
- [specificity](https://github.com/keeganstreet/specificity)

## License

The MIT License (MIT)

Copyright (c) 2015-2023 yWorks GmbH

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
