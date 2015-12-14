# svg2pdf.js
A javascript-only SVG to PDF conversion utility that runs in the browser leveraging jsPDF.

## Installation
If you have cloned this repository via

```bash
git clone https://github.com/yWorks/svg2pdf.js.git
```

run 

```bash
npm install
```

to install all dependencies.

If you're only interested in the complete package, run

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
svgElementToPdf(svgElement, pdf, {
	xOffset: 0,
	yOffset: 0,
	scale: 1
});

// get the data URI
var uri = pdf.output('datauristring');
```

## Dependencies
 * [jsPDF](https://github.com/yWorks/jsPDF) (yWorks fork version!)
 * [jQuery](https://jquery.org/)


## License

The MIT License (MIT)

Copyright (c) 2015 yWorks GmbH, http://www.yworks.com/

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