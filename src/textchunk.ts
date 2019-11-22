import { RGBColor } from './utils/rgbcolor'

import { Context } from './context/context'
import { getTextRenderingMode } from './utils/text'
import { getAttribute } from './utils/node'
import { toPixels, mapAlignmentBaseline } from './utils/misc'
import { parseAttributes, applyAttributes } from './applyparseattributes'
import { SvgNode } from './nodes/svgnode'

/**
 * @param {string} textAnchor
 * @param {number} originX
 * @param {number} originY
 * @constructor
 */
export class TextChunk {
  parent: SvgNode
  private texts: string[]
  private textNodes: HTMLElement[]
  private textAnchor: string
  private originX: number
  private originY: number

  constructor(parent: SvgNode, textAnchor: string, originX: number, originY: number) {
    this.parent = parent
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
    let i, textNode

    let strokeRGB: any
    const xs = [],
      ys = [],
      textNodeContexts = []
    let currentTextX = this.originX,
      currentTextY = this.originY
    let minX = currentTextX,
      maxX = currentTextX
    for (i = 0; i < this.textNodes.length; i++) {
      textNode = this.textNodes[i]

      let x = currentTextX
      let y = currentTextY
      let textNodeContext
      if (textNode.nodeName === '#text') {
        textNodeContext = context
      } else {
        textNodeContext = parseAttributes(context.clone(), this.parent, textNode)

        const tSpanStrokeColor = getAttribute(textNode, 'stroke', context.styleSheets)
        if (tSpanStrokeColor) {
          strokeRGB = new RGBColor(tSpanStrokeColor)
          if (strokeRGB.ok) {
            textNodeContext.attributeState.stroke = strokeRGB
          }
        }
        const strokeWidth = getAttribute(textNode, 'stroke-width', context.styleSheets)
        if (strokeWidth !== void 0) {
          textNodeContext.attributeState.strokeWidth = parseFloat(strokeWidth)
        }

        const tSpanDx = textNode.getAttribute('dx')
        if (tSpanDx !== null) {
          x += toPixels(tSpanDx, textNodeContext.attributeState.fontSize)
        }

        const tSpanDy = textNode.getAttribute('dy')
        if (tSpanDy !== null) {
          y += toPixels(tSpanDy, textNodeContext.attributeState.fontSize)
        }
      }

      textNodeContexts[i] = textNodeContext

      xs[i] = x
      ys[i] = y

      currentTextX =
        x + context.textMeasure.measureTextWidth(this.texts[i], textNodeContext.attributeState)

      currentTextY = y

      minX = Math.min(minX, x)
      maxX = Math.max(maxX, currentTextX)
    }

    let textOffset
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
        const tSpanVisibility =
          getAttribute(textNode, 'visibility', context.styleSheets) || context.attributeState.visibility
        if (tSpanVisibility === 'hidden') {
          continue
        }
      }

      context._pdf.saveGraphicsState()
      applyAttributes(textNodeContexts[i], context, textNode)

      const alignmentBaseline = textNodeContexts[i].attributeState.alignmentBaseline
      const textRenderingMode = getTextRenderingMode(textNodeContexts[i].attributeState)
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
