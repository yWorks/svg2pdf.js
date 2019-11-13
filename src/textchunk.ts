import RGBColor from './utils/rgbcolor'

import Context from './context/context'
import { putTextProperties, getTextRenderingMode, setTextProperties } from './utils/text'
import { getAttribute } from './utils/node'
import { toPixels, mapAlignmentBaseline } from './utils/misc'

/**
 * @param {string} textAnchor
 * @param {number} originX
 * @param {number} originY
 * @constructor
 */
export default class TextChunk {
  private texts: string[]
  private textNodes: HTMLElement[]
  private textAnchor: string
  private originX: number
  private originY: number

  constructor(textAnchor: string, originX: number, originY: number) {
    this.texts = []
    this.textNodes = []
    this.textAnchor = textAnchor
    this.originX = originX
    this.originY = originY
  }

  add(tSpan: HTMLElement, text: string) {
    this.texts.push(text)
    this.textNodes.push(tSpan)
  }

  put(context: Context) {
    var i, textNode

    var strokeRGB: any
    var xs = [],
      ys = [],
      attributeStates = []
    var currentTextX = this.originX,
      currentTextY = this.originY
    var minX = currentTextX,
      maxX = currentTextX
    for (i = 0; i < this.textNodes.length; i++) {
      textNode = this.textNodes[i]

      var x = currentTextX
      var y = currentTextY

      if (textNode.nodeName === '#text') {
        textNodeContext = context
      } else {
        var textNodeContext = context.clone()
        var tSpanColor = getAttribute(textNode, 'fill')
        setTextProperties(textNode, tSpanColor && new RGBColor(tSpanColor), textNodeContext)
        var tSpanStrokeColor = getAttribute(textNode, 'stroke')
        if (tSpanStrokeColor) {
          strokeRGB = new RGBColor(tSpanStrokeColor)
          if (strokeRGB.ok) {
            textNodeContext.attributeState.stroke = strokeRGB
          }
        }
        var strokeWidth = getAttribute(textNode, 'stroke-width')
        if (strokeWidth !== void 0) {
          textNodeContext.attributeState.strokeWidth = parseFloat(strokeWidth)
        }

        var tSpanDx = textNode.getAttribute('dx')
        if (tSpanDx !== null) {
          x += toPixels(tSpanDx, textNodeContext.attributeState.fontSize)
        }

        var tSpanDy = textNode.getAttribute('dy')
        if (tSpanDy !== null) {
          y += toPixels(tSpanDy, textNodeContext.attributeState.fontSize)
        }
      }

      attributeStates[i] = textNodeContext.attributeState

      xs[i] = x
      ys[i] = y

      currentTextX =
        x + context.textMeasure.measureTextWidth(this.texts[i], textNodeContext.attributeState)

      currentTextY = y

      minX = Math.min(minX, x)
      maxX = Math.max(maxX, currentTextX)
    }

    var textOffset
    switch (this.textAnchor) {
      case 'start':
        textOffset = 0
        break
      case 'middle':
        textOffset = (maxX - minX) / 2
        break
      case 'end':
        textOffset = maxX - minX
        break
    }

    for (i = 0; i < this.textNodes.length; i++) {
      textNode = this.textNodes[i]

      if (textNode.nodeName !== '#text') {
        var tSpanVisibility =
          getAttribute(textNode, 'visibility') || context.attributeState.visibility
        if (tSpanVisibility === 'hidden') {
          continue
        }
      }

      context._pdf.saveGraphicsState()
      putTextProperties(attributeStates[i], context.attributeState, context)
      if (
        attributeStates[i].stroke &&
        attributeStates[i].stroke !== context.attributeState.stroke &&
        attributeStates[i].stroke.ok
      ) {
        var strokeRGB = attributeStates[i].stroke
        context._pdf.setDrawColor(strokeRGB.r, strokeRGB.g, strokeRGB.b)
      }
      if (
        attributeStates[i].strokeWidth !== null &&
        attributeStates[i].strokeWidth !== context.attributeState.strokeWidth
      ) {
        context._pdf.setLineWidth(attributeStates[i].strokeWidth)
      }

      var alignmentBaseline = attributeStates[i].alignmentBaseline
      var textRenderingMode = getTextRenderingMode(attributeStates[i])
      context._pdf.text(this.texts[i], xs[i] - textOffset, ys[i], {
        baseline: mapAlignmentBaseline(alignmentBaseline),
        angle: context.transform,
        renderingMode: textRenderingMode === 'fill' ? void 0 : textRenderingMode
      })

      context._pdf.restoreGraphicsState()
    }

    return [currentTextX, currentTextY]
  }
}
