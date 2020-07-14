import { Context } from './context/context'
import { getAttribute, nodeIs, refIsSymbol, nodeIsChildOf } from './utils/node'
import { toPixels } from './utils/misc'
import { RGBColor } from './utils/rgbcolor'
import { parseFloats } from './utils/parsing'
import FontFamily from 'font-family-papandreou'
import { SvgNode } from './nodes/svgnode'
import { findFirstAvailableFontFamily, fontAliases } from './utils/fonts'
import { parseFill } from './fill/parseFill'
import { ColorFill } from './fill/ColorFill'
import { GState } from 'jspdf'

export function parseAttributes(context: Context, svgNode: SvgNode, node?: HTMLElement): void {
  const domNode = node || svgNode.element
  const visibility = getAttribute(domNode, 'visibility')
  if (visibility) {
    context.attributeState.visibility = visibility
  }
  // fill mode
  const fill = getAttribute(domNode, 'fill')
  if (fill) {
    context.attributeState.fill = parseFill(fill, context)
  }

  // opacity is realized via a pdf graphics state
  const fillOpacity = getAttribute(domNode, 'fill-opacity')
  if (fillOpacity) {
    context.attributeState.fillOpacity = parseFloat(fillOpacity)
  }
  const strokeOpacity = getAttribute(domNode, 'stroke-opacity')
  if (strokeOpacity) {
    context.attributeState.strokeOpacity = parseFloat(strokeOpacity)
  }
  const opacity = getAttribute(domNode, 'opacity')
  if (opacity) {
    context.attributeState.opacity = parseFloat(opacity)
  }

  // stroke mode
  let strokeWidth: any = getAttribute(domNode, 'stroke-width')
  if (strokeWidth !== void 0 && strokeWidth !== '') {
    strokeWidth = Math.abs(parseFloat(strokeWidth))
    context.attributeState.strokeWidth = strokeWidth
  }

  const stroke = getAttribute(domNode, 'stroke')
  if (stroke) {
    if (stroke === 'none') {
      context.attributeState.stroke = null
    } else {
      // gradients, patterns not supported for strokes ...
      const strokeRGB = new RGBColor(stroke)
      if (strokeRGB.ok) {
        context.attributeState.stroke = new ColorFill(strokeRGB)
      }
    }
  }

  const lineCap = getAttribute(domNode, 'stroke-linecap')
  if (lineCap) {
    context.attributeState.strokeLinecap = lineCap
  }
  const lineJoin = getAttribute(domNode, 'stroke-linejoin')
  if (lineJoin) {
    context.attributeState.strokeLinejoin = lineJoin
  }
  let dashArray: any = getAttribute(domNode, 'stroke-dasharray')
  if (dashArray) {
    dashArray = parseFloats(dashArray)
    const dashOffset = parseInt(getAttribute(domNode, 'stroke-dashoffset') || '0')
    context.attributeState.strokeDasharray = dashArray
    context.attributeState.strokeDashoffset = dashOffset
  }
  const miterLimit = getAttribute(domNode, 'stroke-miterlimit')
  if (miterLimit !== void 0 && miterLimit !== '') {
    context.attributeState.strokeMiterlimit = parseFloat(miterLimit)
  }

  const xmlSpace = domNode.getAttribute('xml:space')
  if (xmlSpace) {
    context.attributeState.xmlSpace = xmlSpace
  }

  const fontWeight = getAttribute(domNode, 'font-weight')
  if (fontWeight) {
    context.attributeState.fontWeight = fontWeight
  }

  const fontStyle = getAttribute(domNode, 'font-style')
  if (fontStyle) {
    context.attributeState.fontStyle = fontStyle
  }

  const fontFamily = getAttribute(domNode, 'font-family')
  if (fontFamily) {
    const fontFamilies = FontFamily.parse(fontFamily)
    context.attributeState.fontFamily = findFirstAvailableFontFamily(
      context.attributeState,
      fontFamilies,
      context
    )
  }

  const fontSize = getAttribute(domNode, 'font-size')
  if (fontSize) {
    const pdfFontSize = context.pdf.getFontSize()
    context.attributeState.fontSize = toPixels(fontSize, pdfFontSize)
  }

  const alignmentBaseline =
    getAttribute(domNode, 'vertical-align') || getAttribute(domNode, 'alignment-baseline')
  if (alignmentBaseline) {
    const matchArr = alignmentBaseline.match(
      /(baseline|text-bottom|alphabetic|ideographic|middle|central|mathematical|text-top|bottom|center|top|hanging)/
    )
    if (matchArr) {
      context.attributeState.alignmentBaseline = matchArr[0]
    }
  }

  const textAnchor = getAttribute(domNode, 'text-anchor')
  if (textAnchor) {
    context.attributeState.textAnchor = textAnchor
  }
}

export function applyAttributes(
  childContext: Context,
  parentContext: Context,
  node: HTMLElement
): void {
  let fillOpacity = 1.0,
    strokeOpacity = 1.0

  fillOpacity *= childContext.attributeState.fillOpacity
  if (
    childContext.attributeState.fill instanceof ColorFill &&
    typeof childContext.attributeState.fill.color.a === 'number'
  ) {
    fillOpacity *= childContext.attributeState.fill.color.a
  }
  fillOpacity *= childContext.attributeState.opacity

  strokeOpacity *= childContext.attributeState.strokeOpacity
  if (
    childContext.attributeState.stroke instanceof ColorFill &&
    typeof childContext.attributeState.stroke.color.a === 'number'
  ) {
    strokeOpacity *= childContext.attributeState.stroke.color.a
  }
  strokeOpacity *= childContext.attributeState.opacity

  let hasFillOpacity = fillOpacity < 1.0
  let hasStrokeOpacity = strokeOpacity < 1.0

  if (nodeIs(node, 'use') && refIsSymbol(node, childContext)) {
    hasFillOpacity || ((hasFillOpacity = !childContext.attributeState.fill) && (fillOpacity = 0.0))
    hasStrokeOpacity ||
      ((hasStrokeOpacity = !childContext.attributeState.stroke) && (strokeOpacity = 0.0))
  } else if (nodeIsChildOf(node, 'symbol') || nodeIs(node, 'symbol')) {
    hasFillOpacity =
      hasFillOpacity ||
      (childContext.attributeState.fill !== parentContext.attributeState.fill &&
        ((!childContext.attributeState.fill && !(fillOpacity = 0.0)) ||
          (!!childContext.attributeState.fill && !parentContext.attributeState.fill)))
    hasStrokeOpacity =
      hasStrokeOpacity ||
      (childContext.attributeState.stroke !== parentContext.attributeState.stroke &&
        ((!childContext.attributeState.stroke && !(strokeOpacity = 0.0)) ||
          (!!childContext.attributeState.stroke && !parentContext.attributeState.stroke)))
  }

  if (hasFillOpacity || hasStrokeOpacity) {
    const gState: GState = {}
    hasFillOpacity && (gState['opacity'] = fillOpacity)
    hasStrokeOpacity && (gState['stroke-opacity'] = strokeOpacity)
    childContext.pdf.setGState(new GState(gState))
  }

  if (
    childContext.attributeState.fill &&
    childContext.attributeState.fill !== parentContext.attributeState.fill &&
    childContext.attributeState.fill instanceof ColorFill &&
    childContext.attributeState.fill.color.ok &&
    !nodeIs(node, 'text')
  ) {
    // text fill color will be applied through setTextColor()
    childContext.pdf.setFillColor(
      childContext.attributeState.fill.color.r,
      childContext.attributeState.fill.color.g,
      childContext.attributeState.fill.color.b
    )
  }

  if (childContext.attributeState.strokeWidth !== parentContext.attributeState.strokeWidth) {
    childContext.pdf.setLineWidth(childContext.attributeState.strokeWidth)
  }

  if (
    childContext.attributeState.stroke !== parentContext.attributeState.stroke &&
    childContext.attributeState.stroke instanceof ColorFill
  ) {
    childContext.pdf.setDrawColor(
      childContext.attributeState.stroke.color.r,
      childContext.attributeState.stroke.color.g,
      childContext.attributeState.stroke.color.b
    )
  }

  if (childContext.attributeState.strokeLinecap !== parentContext.attributeState.strokeLinecap) {
    childContext.pdf.setLineCap(childContext.attributeState.strokeLinecap)
  }

  if (childContext.attributeState.strokeLinejoin !== parentContext.attributeState.strokeLinejoin) {
    childContext.pdf.setLineJoin(childContext.attributeState.strokeLinejoin)
  }

  if (
    (childContext.attributeState.strokeDasharray !== parentContext.attributeState.strokeDasharray ||
      childContext.attributeState.strokeDashoffset !==
        parentContext.attributeState.strokeDashoffset) &&
    childContext.attributeState.strokeDasharray
  ) {
    childContext.pdf.setLineDashPattern(
      childContext.attributeState.strokeDasharray,
      childContext.attributeState.strokeDashoffset
    )
  }

  if (
    childContext.attributeState.strokeMiterlimit !== parentContext.attributeState.strokeMiterlimit
  ) {
    childContext.pdf.setLineMiterLimit(childContext.attributeState.strokeMiterlimit)
  }

  if (childContext.attributeState.fontFamily !== parentContext.attributeState.fontFamily) {
    if (fontAliases.hasOwnProperty(childContext.attributeState.fontFamily)) {
      childContext.pdf.setFont(fontAliases[childContext.attributeState.fontFamily])
    } else {
      childContext.pdf.setFont(childContext.attributeState.fontFamily)
    }
  }

  if (
    childContext.attributeState.fill &&
    childContext.attributeState.fill !== parentContext.attributeState.fill &&
    childContext.attributeState.fill instanceof ColorFill &&
    childContext.attributeState.fill.color.ok
  ) {
    const fillColor = childContext.attributeState.fill.color
    childContext.pdf.setTextColor(fillColor.r, fillColor.g, fillColor.b)
  }

  if (
    childContext.attributeState.fontWeight !== parentContext.attributeState.fontWeight ||
    childContext.attributeState.fontStyle !== parentContext.attributeState.fontStyle
  ) {
    let fontType = ''
    if (childContext.attributeState.fontWeight === 'bold') {
      fontType = 'bold'
    }
    if (childContext.attributeState.fontStyle === 'italic') {
      fontType += 'italic'
    }

    if (fontType === '') {
      fontType = 'normal'
    }

    childContext.pdf.setFontType(fontType)
  }

  if (childContext.attributeState.fontSize !== parentContext.attributeState.fontSize) {
    // correct for a jsPDF-instance measurement unit that differs from `pt`
    childContext.pdf.setFontSize(
      childContext.attributeState.fontSize * childContext.pdf.internal.scaleFactor
    )
  }
}
