import { SvgNode } from './nodes/svgnode'
import { Context } from './context/context'
import { ReferencesHandler } from './context/referenceshandler'
import { parse } from './parse'
import { ColorFill } from './fill/ColorFill'
import { jsPDF } from 'jspdf'

/**
 * Renders an svg element to a jsPDF document.
 * For accurate results a DOM document is required (mainly used for text size measurement and image format conversion)
 * @param element The svg element, which will be cloned, so the original stays unchanged.
 * @param pdf The jsPDF object.
 * @param options An object that may contain render options. Currently supported are:
 *                         scale: The global factor by which everything is scaled.
 *                         xOffset, yOffset: Offsets that are added to every coordinate AFTER scaling (They are not
 *                            influenced by the scale attribute).
 */

// the actual svgToPdf function (see above)
export async function svg2pdf(
  element: HTMLElement,
  pdf: jsPDF,
  options: Svg2PdfOptions = {}
): Promise<jsPDF> {
  //  create context object
  const context = new Context(pdf)

  const k = options.scale || 1.0,
    xOffset = options.xOffset || 0.0,
    yOffset = options.yOffset || 0.0

  pdf.advancedAPI()
  // set offsets and scale everything by k
  pdf.saveGraphicsState()
  pdf.setCurrentTransformationMatrix(pdf.Matrix(k, 0, 0, k, xOffset, yOffset))

  // set default values that differ from pdf defaults
  pdf.setLineWidth(context.attributeState.strokeWidth)
  const fill = (context.attributeState.fill as ColorFill).color
  pdf.setFillColor(fill.r, fill.g, fill.b)
  pdf.setFont(context.attributeState.fontFamily)
  // correct for a jsPDF-instance measurement unit that differs from `pt`
  pdf.setFontSize(context.attributeState.fontSize * pdf.internal.scaleFactor)

  const idMap: { [id: string]: SvgNode } = {}
  const node = parse(element, idMap)
  context.refsHandler = new ReferencesHandler(idMap)
  await node.render(context)

  pdf.restoreGraphicsState()

  pdf.compatAPI()

  context.textMeasure.cleanupTextMeasuring()

  return pdf
}

jsPDF.API.svg = function(
  element: HTMLElement,
  options: Svg2PdfOptions = {}
): ReturnType<typeof svg2pdf> {
  return svg2pdf(element, this, options)
}

export interface Svg2PdfOptions {
  scale?: number
  xOffset?: number
  yOffset?: number
}
