import { SvgNode } from './nodes/svgnode'
import { Context } from './context/context'
import { ReferencesHandler } from './context/referenceshandler'
import { parse } from './parse'
import { ColorFill } from './fill/ColorFill'
import { jsPDF } from 'jspdf'
import { StyleSheets } from './context/stylesheets'
import { Viewport } from './context/viewport'
import { TextMeasure } from './context/textmeasure'

export async function svg2pdf(
  element: Element,
  pdf: jsPDF,
  options: Svg2PdfOptions = {}
): Promise<jsPDF> {
  const x = options.x ?? 0.0
  const y = options.y ?? 0.0
  const extCss = options.loadExternalStyleSheets ?? false

  //  create context object
  const idMap: { [id: string]: SvgNode } = {}
  const refsHandler = new ReferencesHandler(idMap)

  const styleSheets = new StyleSheets(element, extCss)
  await styleSheets.load()

  // start with the entire page size as viewport
  const viewport = new Viewport(pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight())

  const svg2pdfParameters = { ...options, element }

  const textMeasure = new TextMeasure()

  const context = new Context(pdf, {
    refsHandler,
    styleSheets,
    viewport,
    svg2pdfParameters,
    textMeasure
  })

  pdf.advancedAPI()
  pdf.saveGraphicsState()
  // set offsets
  pdf.setCurrentTransformationMatrix(pdf.Matrix(1, 0, 0, 1, x, y))

  // set default values that differ from pdf defaults
  pdf.setLineWidth(context.attributeState.strokeWidth)
  const fill = (context.attributeState.fill as ColorFill).color
  pdf.setFillColor(fill.r, fill.g, fill.b)
  pdf.setFont(context.attributeState.fontFamily)
  // correct for a jsPDF-instance measurement unit that differs from `pt`
  pdf.setFontSize(context.attributeState.fontSize * pdf.internal.scaleFactor)

  const node = parse(element, idMap)
  await node.render(context)

  pdf.restoreGraphicsState()

  pdf.compatAPI()

  context.textMeasure.cleanupTextMeasuring()

  return pdf
}

jsPDF.API.svg = function(
  element: Element,
  options: Svg2PdfOptions = {}
): ReturnType<typeof svg2pdf> {
  return svg2pdf(element, this, options)
}

export interface Svg2PdfOptions {
  x?: number
  y?: number
  width?: number
  height?: number
  loadExternalStyleSheets?: boolean
  /**
   * Optional callback function that is called when an image fails to load.
   * If provided, this callback will be invoked with error details instead of
   * silently ignoring the error. The callback can decide how to handle the error
   * (e.g., throw an exception, log to a custom logging system, or provide fallback behavior).
   *
   * @param imageUrl - The URL of the image that failed to load
   * @param error - The error object describing what went wrong
   * @param element - The SVG image element that failed to load
   * @returns If the callback returns `true`, the error will be re-thrown to interrupt the rendering process.
   *          If it returns `false`, the error will be silently ignored and the image will be skipped.
   */
  onImageError?: (imageUrl: string, error: Error, element: Element) => boolean
}
