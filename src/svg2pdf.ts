/*
The MIT License (MIT)

Copyright (c) 2015-2017 yWorks GmbH

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
*/

import { SvgNode } from './nodes/svgnode'
import { Context } from './context/context'
import { ReferencesHandler } from './context/referenceshandler'
import { parse } from './parse'

/**
 * Renders an svg element to a jsPDF document.
 * For accurate results a DOM document is required (mainly used for text size measurement and image format conversion)
 * @param element {HTMLElement} The svg element, which will be cloned, so the original stays unchanged.
 * @param pdf {jsPDF} The jsPDF object.
 * @param options {object} An object that may contain render options. Currently supported are:
 *                         scale: The global factor by which everything is scaled.
 *                         xOffset, yOffset: Offsets that are added to every coordinate AFTER scaling (They are not
 *                            influenced by the scale attribute).
 */

// the actual svgToPdf function (see above)
function svg2pdf(element: HTMLElement, pdf: any, options: any) {
  const _pdf = pdf

  //  create context object
  let context = new Context(_pdf)

  const k = options.scale || 1.0,
    xOffset = options.xOffset || 0.0,
    yOffset = options.yOffset || 0.0

  _pdf.advancedAPI(() => {
    // set offsets and scale everything by k
    _pdf.saveGraphicsState()
    _pdf.setCurrentTransformationMatrix(new _pdf.Matrix(k, 0, 0, k, xOffset, yOffset))

    // set default values that differ from pdf defaults
    _pdf.setLineWidth(context.attributeState.strokeWidth)
    const fill = context.attributeState.fill
    _pdf.setFillColor(fill.r, fill.g, fill.b)
    _pdf.setFont(context.attributeState.fontFamily)
    // correct for a jsPDF-instance measurement unit that differs from `pt`
    _pdf.setFontSize(context.attributeState.fontSize * _pdf.internal.scaleFactor)

    const clonedSvg = element.cloneNode(true) as HTMLElement
    let idMap:{[id:string]:SvgNode} = {}
    const svgnode = parse(clonedSvg, idMap)
    context.refsHandler = new ReferencesHandler(idMap)
    context.transform = svgnode.computeNodeTransform(context)
    svgnode.render(context)

    _pdf.restoreGraphicsState()
  })

  context.textMeasure.cleanupTextMeasuring()

  return _pdf
}

export default svg2pdf
