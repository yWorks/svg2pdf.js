import { Context } from './context/context'
import { getAttribute, nodeIs } from './utils/node'
import { toPixels } from './utils/misc'
import { parseColor, parseFloats } from './utils/parsing'
import FontFamily from 'font-family-papandreou'
import { SvgNode } from './nodes/svgnode'
import {
  combineFontStyleAndFontWeight,
  findFirstAvailableFontFamily,
  fontAliases
} from './utils/fonts'
import { parseFill } from './fill/parseFill'
import { ColorFill } from './fill/ColorFill'
import { GState } from 'jspdf'
import { RGBColor } from './utils/rgbcolor'

export function parseAttributes(context: Context, svgNode: SvgNode, node?: Element): void {
  const domNode = node || svgNode.element
  // update color first so currentColor becomes available for this node
  const color = getAttribute(domNode, context.styleSheets, 'color')
  if (color) {
    const fillColor = parseColor(color, context.attributeState.color)
    if (fillColor.ok) {
      context.attributeState.color = fillColor
    } else {
      // invalid color passed, reset to black
      context.attributeState.color = new RGBColor('rgb(0,0,0)')
    }
  }

  const visibility = getAttribute(domNode, context.styleSheets, 'visibility')
  if (visibility) {
    context.attributeState.visibility = visibility
  }
  // fill mode
  const fill = getAttribute(domNode, context.styleSheets, 'fill')
  if (fill) {
    context.attributeState.fill = parseFill(fill, context)
  }

  // opacity is realized via a pdf graphics state
  const fillOpacity = getAttribute(domNode, context.styleSheets, 'fill-opacity')
  if (fillOpacity) {
    context.attributeState.fillOpacity = parseFloat(fillOpacity)
  }
  const strokeOpacity = getAttribute(domNode, context.styleSheets, 'stroke-opacity')
  if (strokeOpacity) {
    context.attributeState.strokeOpacity = parseFloat(strokeOpacity)
  }
  const opacity = getAttribute(domNode, context.styleSheets, 'opacity')
  if (opacity) {
    context.attributeState.opacity = parseFloat(opacity)
  }

  // stroke mode
  const strokeWidth = getAttribute(domNode, context.styleSheets, 'stroke-width')
  if (strokeWidth !== void 0 && strokeWidth !== '') {
    context.attributeState.strokeWidth = Math.abs(parseFloat(strokeWidth))
  }

  const stroke = getAttribute(domNode, context.styleSheets, 'stroke')
  if (stroke) {
    if (stroke === 'none') {
      context.attributeState.stroke = null
    } else {
      // gradients, patterns not supported for strokes ...
      const strokeRGB = parseColor(stroke, context.attributeState.color)
      if (strokeRGB.ok) {
        context.attributeState.stroke = new ColorFill(strokeRGB)
      }
    }
  }

  const lineCap = getAttribute(domNode, context.styleSheets, 'stroke-linecap')
  if (lineCap) {
    context.attributeState.strokeLinecap = lineCap
  }
  const lineJoin = getAttribute(domNode, context.styleSheets, 'stroke-linejoin')
  if (lineJoin) {
    context.attributeState.strokeLinejoin = lineJoin
  }
  const dashArray = getAttribute(domNode, context.styleSheets, 'stroke-dasharray')
  if (dashArray) {
    const dashOffset = parseInt(
      getAttribute(domNode, context.styleSheets, 'stroke-dashoffset') || '0'
    )
    context.attributeState.strokeDasharray = parseFloats(dashArray)
    context.attributeState.strokeDashoffset = dashOffset
  }
  const miterLimit = getAttribute(domNode, context.styleSheets, 'stroke-miterlimit')
  if (miterLimit !== void 0 && miterLimit !== '') {
    context.attributeState.strokeMiterlimit = parseFloat(miterLimit)
  }

  const xmlSpace = domNode.getAttribute('xml:space')
  if (xmlSpace) {
    context.attributeState.xmlSpace = xmlSpace
  }

  const fontWeight = getAttribute(domNode, context.styleSheets, 'font-weight')
  if (fontWeight) {
    context.attributeState.fontWeight = fontWeight
  }

  const fontStyle = getAttribute(domNode, context.styleSheets, 'font-style')
  if (fontStyle) {
    context.attributeState.fontStyle = fontStyle
  }

  const fontFamily = getAttribute(domNode, context.styleSheets, 'font-family')
  if (fontFamily) {
    const fontFamilies = FontFamily.parse(fontFamily)
    context.attributeState.fontFamily = findFirstAvailableFontFamily(
      context.attributeState,
      fontFamilies,
      context
    )
  }

  const fontSize = getAttribute(domNode, context.styleSheets, 'font-size')
  if (fontSize) {
    const pdfFontSize = context.pdf.getFontSize()
    context.attributeState.fontSize = toPixels(fontSize, pdfFontSize)
  }

  const alignmentBaseline =
    getAttribute(domNode, context.styleSheets, 'vertical-align') ||
    getAttribute(domNode, context.styleSheets, 'alignment-baseline') ||
    getAttribute(domNode, context.styleSheets, 'dominant-baseline')
  if (alignmentBaseline) {
    const matchArr = alignmentBaseline.match(
      /(baseline|text-bottom|alphabetic|ideographic|middle|central|mathematical|text-top|bottom|center|top|hanging)/
    )
    if (matchArr) {
      context.attributeState.alignmentBaseline = matchArr[0]
    }
  }

  const textAnchor = getAttribute(domNode, context.styleSheets, 'text-anchor')
  if (textAnchor) {
    context.attributeState.textAnchor = textAnchor
  }
}

export function applyAttributes(
  childContext: Context,
  parentContext: Context,
  node: Element
): void {
  let fillOpacity = 1.0,
    strokeOpacity = 1.0

  fillOpacity *= childContext.attributeState.fillOpacity
  fillOpacity *= childContext.attributeState.opacity
  if (
    childContext.attributeState.fill instanceof ColorFill &&
    typeof childContext.attributeState.fill.color.a !== 'undefined'
  ) {
    fillOpacity *= childContext.attributeState.fill.color.a
  }

  strokeOpacity *= childContext.attributeState.strokeOpacity
  strokeOpacity *= childContext.attributeState.opacity
  if (
    childContext.attributeState.stroke instanceof ColorFill &&
    typeof childContext.attributeState.stroke.color.a !== 'undefined'
  ) {
    strokeOpacity *= childContext.attributeState.stroke.color.a
  }

  let hasFillOpacity = fillOpacity < 1.0
  let hasStrokeOpacity = strokeOpacity < 1.0

  // This is a workaround for symbols that are used multiple times with different
  // fill/stroke attributes. All paths within symbols are both filled and stroked
  // and we set the fill/stroke to transparent if the use element has
  // fill/stroke="none".
  if (nodeIs(node, 'use')) {
    hasFillOpacity = true
    hasStrokeOpacity = true
    fillOpacity *= childContext.attributeState.fill ? 1 : 0
    strokeOpacity *= childContext.attributeState.stroke ? 1 : 0
  } else if (childContext.withinUse) {
    if (childContext.attributeState.fill !== parentContext.attributeState.fill) {
      hasFillOpacity = true
      fillOpacity *= childContext.attributeState.fill ? 1 : 0
    } else if (hasFillOpacity && !childContext.attributeState.fill) {
      fillOpacity = 0
    }
    if (childContext.attributeState.stroke !== parentContext.attributeState.stroke) {
      hasStrokeOpacity = true
      strokeOpacity *= childContext.attributeState.stroke ? 1 : 0
    } else if (hasStrokeOpacity && !childContext.attributeState.stroke) {
      strokeOpacity = 0
    }
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

  let font: string | undefined
  if (childContext.attributeState.fontFamily !== parentContext.attributeState.fontFamily) {
    if (fontAliases.hasOwnProperty(childContext.attributeState.fontFamily)) {
      font = fontAliases[childContext.attributeState.fontFamily]
    } else {
      font = childContext.attributeState.fontFamily
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

  let fontStyle: string | undefined
  if (
    childContext.attributeState.fontWeight !== parentContext.attributeState.fontWeight ||
    childContext.attributeState.fontStyle !== parentContext.attributeState.fontStyle
  ) {
    fontStyle = combineFontStyleAndFontWeight(
      childContext.attributeState.fontStyle,
      childContext.attributeState.fontWeight
    )
  }

  if (font !== undefined || fontStyle !== undefined) {
    if (font === undefined) {
      if (fontAliases.hasOwnProperty(childContext.attributeState.fontFamily)) {
        font = fontAliases[childContext.attributeState.fontFamily]
      } else {
        font = childContext.attributeState.fontFamily
      }
    }
    childContext.pdf.setFont(font, fontStyle)
  }

  if (childContext.attributeState.fontSize !== parentContext.attributeState.fontSize) {
    // correct for a jsPDF-instance measurement unit that differs from `pt`
    childContext.pdf.setFontSize(
      childContext.attributeState.fontSize * childContext.pdf.internal.scaleFactor
    )
  }
}

export function applyContext(context: Context): void {
  const { attributeState, pdf } = context

  let fillOpacity = 1.0,
    strokeOpacity = 1.0

  fillOpacity *= attributeState.fillOpacity
  fillOpacity *= attributeState.opacity
  if (
    attributeState.fill instanceof ColorFill &&
    typeof attributeState.fill.color.a !== 'undefined'
  ) {
    fillOpacity *= attributeState.fill.color.a
  }

  strokeOpacity *= attributeState.strokeOpacity
  strokeOpacity *= attributeState.opacity
  if (
    attributeState.stroke instanceof ColorFill &&
    typeof attributeState.stroke.color.a !== 'undefined'
  ) {
    strokeOpacity *= attributeState.stroke.color.a
  }

  const gState: GState = {}
  gState['opacity'] = fillOpacity
  gState['stroke-opacity'] = strokeOpacity
  pdf.setGState(new GState(gState))

  if (
    attributeState.fill &&
    attributeState.fill instanceof ColorFill &&
    attributeState.fill.color.ok
  ) {
    // text fill color will be applied through setTextColor()
    pdf.setFillColor(
      attributeState.fill.color.r,
      attributeState.fill.color.g,
      attributeState.fill.color.b
    )
  } else {
    pdf.setFillColor(0, 0, 0)
  }

  pdf.setLineWidth(attributeState.strokeWidth)

  if (attributeState.stroke instanceof ColorFill) {
    pdf.setDrawColor(
      attributeState.stroke.color.r,
      attributeState.stroke.color.g,
      attributeState.stroke.color.b
    )
  } else {
    pdf.setDrawColor(0, 0, 0)
  }

  pdf.setLineCap(attributeState.strokeLinecap)
  pdf.setLineJoin(attributeState.strokeLinejoin)

  if (attributeState.strokeDasharray) {
    pdf.setLineDashPattern(attributeState.strokeDasharray, attributeState.strokeDashoffset)
  } else {
    pdf.setLineDashPattern([], 0)
  }

  pdf.setLineMiterLimit(attributeState.strokeMiterlimit)

  let font: string | undefined
  if (fontAliases.hasOwnProperty(attributeState.fontFamily)) {
    font = fontAliases[attributeState.fontFamily]
  } else {
    font = attributeState.fontFamily
  }

  if (
    attributeState.fill &&
    attributeState.fill instanceof ColorFill &&
    attributeState.fill.color.ok
  ) {
    const fillColor = attributeState.fill.color
    pdf.setTextColor(fillColor.r, fillColor.g, fillColor.b)
  } else {
    pdf.setTextColor(0, 0, 0)
  }

  let fontStyle: string | undefined = ''
  if (attributeState.fontWeight === 'bold') {
    fontStyle = 'bold'
  }
  if (attributeState.fontStyle === 'italic') {
    fontStyle += 'italic'
  }

  if (fontStyle === '') {
    fontStyle = 'normal'
  }

  if (font !== undefined || fontStyle !== undefined) {
    if (font === undefined) {
      if (fontAliases.hasOwnProperty(attributeState.fontFamily)) {
        font = fontAliases[attributeState.fontFamily]
      } else {
        font = attributeState.fontFamily
      }
    }
    pdf.setFont(font, fontStyle)
  } else {
    pdf.setFont('helvetica', fontStyle)
  }

  // correct for a jsPDF-instance measurement unit that differs from `pt`
  pdf.setFontSize(attributeState.fontSize * pdf.internal.scaleFactor)
}
