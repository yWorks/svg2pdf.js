# svg2pdf.js
A javascript-only SVG to PDF conversion utility that runs in the browser leveraging jsPDF.

## Installation
If you have cloned this repository via

```bash
git clone https://github.com/yWorks/svg2pdf.js.git
```

run 

```bash
bower install
```

or 

```bash
npm install
```

to install all dependencies.

If you're only interested in the complete package, run

```bash
bower install svg2pdf.js
```

or 

```bash
npm install svg2pdf.js
```

## Usage
```javascript
var svgElement = document.getElementById('svg');
var width = 300, height = 200;

// create a new jsPDF instance
var pdf = new jsPDF('l', 'pt', [width, height]);

// render the svg element
svg2pdf(svgElement, pdf, {
	xOffset: 0,
	yOffset: 0,
	scale: 1
});

// get the data URI
var uri = pdf.output('datauristring');
```

## Building

If you want to play with the sources or build the minified js file yourself, check out the repository and use the npm scripts defined in `package.json`:

```bash
npm run build
```

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
