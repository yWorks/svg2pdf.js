import { Context } from './context/context'
import { getAttribute, nodeIs } from './utils/node'
import { getFill } from './utils/misc'
import { RGBColor } from './utils/rgbcolor'
import { parseFloats } from './utils/parsing'
import FontFamily from 'font-family-papandreou'
import { SvgNode } from './nodes/svgnode'
import { findFirstAvailableFontFamily, fontAliases } from './utils/fonts'

export function parseAttributes(context: Context, svgNode: SvgNode, node?: HTMLElement): void {
  const domNode = node || svgNode.element
  const visibility = getAttribute(domNode, 'visibility')
  if (visibility) {
    context.attributeState.visibility = visibility
  }
  // fill mode
  const fillColor = getAttribute(domNode, 'fill')
  if (fillColor) {
    context.attributeState.fill = getFill(fillColor, context, svgNode)
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
  } else {
    // needed for inherited zero width strokes
    strokeWidth = context.attributeState.strokeWidth
  }

  const strokeColor = getAttribute(domNode, 'stroke')
  if (strokeColor) {
    if (strokeColor === 'none') {
      context.attributeState.stroke = null
    } else {
      const strokeRGB = new RGBColor(strokeColor)
      if (strokeRGB.ok) {
        context.attributeState.stroke = strokeRGB
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
    const dashOffset = parseInt(getAttribute(domNode, 'stroke-dashoffset')) || 0
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
    context.attributeState.fontSize = parseFloat(fontSize)
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
    childContext.attributeState.fill instanceof RGBColor &&
    typeof childContext.attributeState.fill.a === 'number'
  ) {
    fillOpacity *= childContext.attributeState.fill.a
  }
  fillOpacity *= childContext.attributeState.opacity

  strokeOpacity *= childContext.attributeState.strokeOpacity
  if (
    childContext.attributeState.stroke instanceof RGBColor &&
    typeof childContext.attributeState.stroke.a === 'number'
  ) {
    strokeOpacity *= childContext.attributeState.stroke.a
  }
  strokeOpacity *= childContext.attributeState.opacity

  const hasFillOpacity = fillOpacity < 1.0
  const hasStrokeOpacity = strokeOpacity < 1.0
  if (hasFillOpacity || hasStrokeOpacity) {
    const gState: any = {}
    hasFillOpacity && (gState['opacity'] = fillOpacity)
    hasStrokeOpacity && (gState['stroke-opacity'] = strokeOpacity)
    childContext.pdf.setGState(new childContext.pdf.GState(gState))
  }

  if (
    childContext.attributeState.fill instanceof RGBColor &&
    childContext.attributeState.fill !== parentContext.attributeState.fill &&
    !nodeIs(node, 'text')
  ) {
    // text fill color will be applied through setTextColor()
    childContext.pdf.setFillColor(
      childContext.attributeState.fill.r,
      childContext.attributeState.fill.g,
      childContext.attributeState.fill.b
    )
  }

  if (childContext.attributeState.strokeWidth !== parentContext.attributeState.strokeWidth) {
    childContext.pdf.setLineWidth(childContext.attributeState.strokeWidth)
  }

  if (childContext.attributeState.stroke !== parentContext.attributeState.stroke) {
    childContext.pdf.setDrawColor(
      childContext.attributeState.stroke.r,
      childContext.attributeState.stroke.g,
      childContext.attributeState.stroke.b
    )
  } else if (childContext.attributeState.stroke === 'inherit') {
    childContext.attributeState.stroke = parentContext.attributeState.stroke
  }

  if (childContext.attributeState.strokeLinecap !== parentContext.attributeState.strokeLinecap) {
    childContext.pdf.setLineCap(childContext.attributeState.strokeLinecap)
  }

  if (childContext.attributeState.strokeLinejoin !== parentContext.attributeState.strokeLinejoin) {
    childContext.pdf.setLineJoin(childContext.attributeState.strokeLinejoin)
  }

  if (
    childContext.attributeState.strokeDasharray !== parentContext.attributeState.strokeDasharray ||
    childContext.attributeState.strokeDashoffset !== parentContext.attributeState.strokeDashoffset
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
    childContext.attributeState.fill.ok
  ) {
    const fillRGB = childContext.attributeState.fill
    childContext.pdf.setTextColor(fillRGB.r, fillRGB.g, fillRGB.b)
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
