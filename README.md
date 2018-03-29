# svg2pdf.js
A javascript-only SVG to PDF conversion utility that runs in the browser leveraging jsPDF.

## Installation
You can get svg2pf.js via npm:

```
$ npm install svg2pdf.js --save
```
or bower:
```
$ bower install svg2pdf.js --save
```

Then import via [requirejs](http://requirejs.org/):
```javascript
require.config({
  baseUrl: './node_modules' // or './bower_components'
});
require([
  'svg2pdf.js/dist/svg2pdf.min',
  'jspdf-yworks/dist/jspdf.min'
], function (svg2pdf, jsPDF) {...});
```

or script-tag:
```html
<script src="[node_modules|bower_components]/jspdf-yworks/dist/jspdf.min.js"></script>
<script src="[node_modules|bower_components]/svg2pdf.js/dist/svg2pdf.min.js"></script>
```

## Usage
```javascript
const svgElement = document.getElementById('svg');
const width = 300, height = 200;

// create a new jsPDF instance
const pdf = new jsPDF('l', 'pt', [width, height]);

// render the svg element
svg2pdf(svgElement, pdf, {
	xOffset: 0,
	yOffset: 0,
	scale: 1
});

// get the data URI
const uri = pdf.output('datauristring');

// or simply safe the created pdf
pdf.save('myPDF.pdf');
```

## Concerning custom fonts
If you want to use other than really basic fonts you will have to add them first before calling ```svg2pdf```:
```js
pdf.addFont('myFont.ttf', 'myFont', 'normal');
```
Please refer to the [jsPDF readme](https://github.com/yWorks/jsPDF).

## Building

If you want to play with the sources or build the minified js file yourself, check out the repository and use the npm scripts defined in `package.json`:

```bash
npm run build
```

### Testing
The ```tests``` folder contains a set of unit tests. Each unit test has its own folder and contains exactly two files:
 * A ```spec.svg``` file that contains the svg to test
 * A ```reference.pdf``` file that is generated automatically and serves as reference for regression testing
 
You can run the tests using

```sh
$ npm run createreferences && npm run test
```

The tests use the [Karma](https://karma-runner.github.io/2.0/index.html) framework and thus run in a captured browser.
Have a look at the ```karma.conf.js``` file for configuration (e.g. which browsers to use).

The ```createreferences``` script starts a server that automatically saves reference PDFs if they don't already exist.
You can omit this command if you just want to test for regression.

If you're debugging and want to have visual feedback, you should switch the ```debug``` flag to ```true``` in ```tests/runTests.js```.
This ensures that a new reference PDF will be created on every run. You might also want to disable some of the tests in
the ```tests``` array.

## Dependencies
 * [jsPDF](https://github.com/yWorks/jsPDF) (yWorks fork version!)
 * [fontello/svgpath](https://github.com/fontello/svgpath)

## License

The MIT License (MIT)

Copyright (c) 2015-2016 yWorks GmbH

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
