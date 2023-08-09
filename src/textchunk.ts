import { Context } from './context/context'
import { getTextRenderingMode, trimRight } from './utils/text'
import { mapAlignmentBaseline, toPixels } from './utils/misc'
import { applyAttributes } from './applyparseattributes'
import { TextNode } from './nodes/text'
import { Point } from './utils/geometry'
import { nodeIs } from './utils/node'

/**
 * @param {string} textAnchor
 * @param {number} originX
 * @param {number} originY
 * @constructor
 */
export class TextChunk {
  private readonly textNode: TextNode
  private readonly texts: string[]
  private readonly textNodes: Element[]
  private readonly contexts: Context[]
  private readonly textAnchor: string
  private originX: number
  private originY: number

  readonly textMeasures: { width: number; length: number }[]

  constructor(parent: TextNode, textAnchor: string, originX: number, originY: number) {
    this.textNode = parent
    this.texts = []
    this.textNodes = []
    this.contexts = []
    this.textAnchor = textAnchor
    this.originX = originX
    this.originY = originY
    this.textMeasures = []
  }

  setX(originX: number): void {
    this.originX = originX
  }

  setY(originY: number): void {
    this.originY = originY
  }

  add(tSpan: Element, text: string, context: Context): void {
    this.texts.push(text)
    this.textNodes.push(tSpan)
    this.contexts.push(context)
  }

  rightTrimText(): boolean {
    for (let r = this.texts.length - 1; r >= 0; r--) {
      if (this.contexts[r].attributeState.xmlSpace === 'default') {
        this.texts[r] = trimRight(this.texts[r])
      }
      // If find a letter, stop right-trimming
      if (this.texts[r].match(/[^\s]/)) {
        return false
      }
    }
    return true
  }

  measureText(context: Context): void {
    for (let i = 0; i < this.texts.length; i++) {
      this.textMeasures.push({
        width: context.textMeasure.measureTextWidth(this.texts[i], this.contexts[i].attributeState),
        length: this.texts[i].length
      })
    }
  }

  put(context: Context, charSpace: number): Point {
    let i, textNode, textNodeContext, textMeasure

    const alreadySeen: Element[] = []

    const xs = [],
      ys = []
    let currentTextX = this.originX,
      currentTextY = this.originY
    let minX = currentTextX,
      maxX = currentTextX
    for (i = 0; i < this.textNodes.length; i++) {
      textNode = this.textNodes[i]
      textNodeContext = this.contexts[i]
      textMeasure = this.textMeasures[i] || {
        width: context.textMeasure.measureTextWidth(this.texts[i], this.contexts[i].attributeState),
        length: this.texts[i].length
      }

      let x = currentTextX
      let y = currentTextY
      if (textNode.nodeName !== '#text') {
        if (!alreadySeen.includes(textNode)) {
          alreadySeen.push(textNode)

          const tSpanDx = TextChunk.resolveRelativePositionAttribute(textNode, 'dx')
          if (tSpanDx !== null) {
            x += toPixels(tSpanDx, textNodeContext.attributeState.fontSize)
          }

          const tSpanDy = TextChunk.resolveRelativePositionAttribute(textNode, 'dy')
          if (tSpanDy !== null) {
            y += toPixels(tSpanDy, textNodeContext.attributeState.fontSize)
          }
        }
      }

      xs[i] = x
      ys[i] = y

      currentTextX = x + textMeasure.width + textMeasure.length * charSpace

      currentTextY = y

      minX = Math.min(minX, x)
      maxX = Math.max(maxX, currentTextX)
    }

    let textOffset = 0
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
      textNodeContext = this.contexts[i]

      if (textNode.nodeName !== '#text') {
        if (textNodeContext.attributeState.visibility === 'hidden') {
          continue
        }
      }

      context.pdf.saveGraphicsState()
      applyAttributes(textNodeContext, context, textNode)

      const alignmentBaseline = textNodeContext.attributeState.alignmentBaseline
      const textRenderingMode = getTextRenderingMode(textNodeContext.attributeState)
      context.pdf.text(this.texts[i], xs[i] - textOffset, ys[i], {
        baseline: mapAlignmentBaseline(alignmentBaseline),
        angle: context.transform,
        renderingMode: textRenderingMode === 'fill' ? void 0 : textRenderingMode,
        charSpace: charSpace === 0 ? void 0 : charSpace
      })

      context.pdf.restoreGraphicsState()
    }

    return [currentTextX, currentTextY]
  }

  /**
   * Resolves a positional attribute (dx, dy) on a given tSpan, possibly
   * inheriting it from the nearest ancestor. Positional attributes
   * are only inherited from a parent to its first child.
   */
  private static resolveRelativePositionAttribute(
    element: Element,
    attributeName: 'dx' | 'dy'
  ): string | null {
    let currentElement: Element | null = element
    while (currentElement && nodeIs(currentElement, 'tspan')) {
      if (currentElement.hasAttribute(attributeName)) {
        return currentElement.getAttribute(attributeName)
      }

      if (!(element.parentElement?.firstChild === element)) {
        // positional attributes are only inherited from a parent to its first child
        break
      }

      currentElement = currentElement.parentElement
    }

    return null
  }
}
