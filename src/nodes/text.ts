import { Context } from '../context/context'
import { TextChunk } from '../textchunk'
import { defaultBoundingBox } from '../utils/bbox'
import { mapAlignmentBaseline, toPixels } from '../utils/misc'
import { getAttribute, nodeIs, svgNodeAndChildrenVisible } from '../utils/node'
import {
  consolidateSpaces,
  getTextRenderingMode,
  removeNewlines,
  replaceTabsBySpace,
  transformText,
  transformXmlSpace,
  trimLeft
} from '../utils/text'
import { GraphicsNode } from './graphicsnode'
import { Rect } from '../utils/geometry'
import { Matrix } from 'jspdf'
import { SvgNode } from './svgnode'
import { parseAttributes, applyContext } from '../applyparseattributes'

interface TrimInfo {
  prevText: string
  prevContext: Context
}

export class TextNode extends GraphicsNode {
  private processTSpans(
    textNode: SvgNode,
    node: Element,
    context: Context,
    textChunks: { type: 'x' | 'y' | ''; chunk: TextChunk }[],
    currentTextSegment: TextChunk,
    trimInfo: TrimInfo
  ): boolean {
    const pdfFontSize = context.pdf.getFontSize()
    const xmlSpace = context.attributeState.xmlSpace
    let firstText = true,
      initialSpace = false

    for (let i = 0; i < node.childNodes.length; i++) {
      const childNode = node.childNodes[i] as Element
      if (!childNode.textContent) {
        continue
      }

      const textContent = childNode.textContent

      if (childNode.nodeName === '#text') {
        let trimmedText = removeNewlines(textContent)
        trimmedText = replaceTabsBySpace(trimmedText)

        if (xmlSpace === 'default') {
          trimmedText = consolidateSpaces(trimmedText)
          // If first text in tspan and starts with a space
          if (firstText && trimmedText.match(/^\s/)) {
            initialSpace = true
          }
          // No longer the first text if we've found a letter
          if (trimmedText.match(/[^\s]/)) {
            firstText = false
          }
          // Consolidate spaces across different children
          if (trimInfo.prevText.match(/\s$/)) {
            trimmedText = trimLeft(trimmedText)
          }
        }

        const transformedText = transformText(node, trimmedText, context)
        currentTextSegment.add(node, transformedText, context)
        trimInfo.prevText = textContent
        trimInfo.prevContext = context
      } else if (nodeIs(childNode, 'title')) {
        // ignore <title> elements
      } else if (nodeIs(childNode, 'tspan')) {
        const tSpan = childNode

        const tSpanAbsX = tSpan.getAttribute('x')
        if (tSpanAbsX !== null) {
          const x = toPixels(tSpanAbsX, pdfFontSize)

          currentTextSegment = new TextChunk(
            this,
            getAttribute(tSpan, context.styleSheets, 'text-anchor') ||
              context.attributeState.textAnchor,
            x,
            0
          )
          textChunks.push({ type: 'y', chunk: currentTextSegment })
        }

        const tSpanAbsY = tSpan.getAttribute('y')
        if (tSpanAbsY !== null) {
          const y = toPixels(tSpanAbsY, pdfFontSize)

          currentTextSegment = new TextChunk(
            this,
            getAttribute(tSpan, context.styleSheets, 'text-anchor') ||
              context.attributeState.textAnchor,
            0,
            y
          )
          textChunks.push({ type: 'x', chunk: currentTextSegment })
        }

        const childContext = context.clone()
        parseAttributes(childContext, textNode, tSpan)

        this.processTSpans(textNode, tSpan, childContext, textChunks, currentTextSegment, trimInfo)
      }
    }

    return initialSpace
  }

  protected async renderCore(context: Context): Promise<void> {
    context.pdf.saveGraphicsState()

    let xOffset = 0
    let charSpace = 0
    // If string starts with \s then for charSpace calculations
    // need to treat it as if it contains one extra character
    let lengthAdjustment = 1

    const pdfFontSize = context.pdf.getFontSize()
    const textX = toPixels(this.element.getAttribute('x'), pdfFontSize)
    const textY = toPixels(this.element.getAttribute('y'), pdfFontSize)

    const dx = toPixels(this.element.getAttribute('dx'), pdfFontSize)
    const dy = toPixels(this.element.getAttribute('dy'), pdfFontSize)

    const textLength = parseFloat(this.element.getAttribute('textLength') || '0')

    const visibility = context.attributeState.visibility
    // when there are no tspans draw the text directly
    const tSpanCount = this.element.childElementCount
    if (tSpanCount === 0) {
      const textContent = this.element.textContent || ''
      const trimmedText = transformXmlSpace(textContent, context.attributeState)
      const transformedText = transformText(this.element, trimmedText, context)
      xOffset = context.textMeasure.getTextOffset(transformedText, context.attributeState)

      if (textLength > 0) {
        const defaultSize = context.textMeasure.measureTextWidth(
          transformedText,
          context.attributeState
        )
        if (context.attributeState.xmlSpace === 'default' && textContent.match(/^\s/)) {
          lengthAdjustment = 0
        }
        charSpace = (textLength - defaultSize) / (transformedText.length - lengthAdjustment) || 0
      }

      if (visibility === 'visible') {
        const alignmentBaseline = context.attributeState.alignmentBaseline
        const textRenderingMode = getTextRenderingMode(context.attributeState)
        applyContext(context)
        context.pdf.text(transformedText, textX + dx - xOffset, textY + dy, {
          baseline: mapAlignmentBaseline(alignmentBaseline),
          angle: context.transform,
          renderingMode: textRenderingMode === 'fill' ? void 0 : textRenderingMode,
          charSpace: charSpace === 0 ? void 0 : charSpace
        })
      }
    } else {
      // otherwise loop over tspans and position each relative to the previous one
      const textChunks: { type: 'x' | 'y' | ''; chunk: TextChunk }[] = []
      const currentTextSegment = new TextChunk(
        this,
        context.attributeState.textAnchor,
        textX + dx,
        textY + dy
      )
      textChunks.push({ type: '', chunk: currentTextSegment })

      const initialSpace = this.processTSpans(
        this,
        this.element,
        context,
        textChunks,
        currentTextSegment,
        // Set prevText to ' ' so any spaces on left of <text> are trimmed
        { prevText: ' ', prevContext: context }
      )

      lengthAdjustment = initialSpace ? 0 : 1

      // Right trim the chunks (if required)
      let trimRight = true
      for (let r = textChunks.length - 1; r >= 0; r--) {
        if (trimRight) {
          trimRight = textChunks[r].chunk.rightTrimText()
        }
      }

      if (textLength > 0) {
        // Calculate the total 'default' width of this text element
        let totalDefaultWidth = 0
        let totalLength = 0
        textChunks.forEach(({ chunk }) => {
          chunk.measureText(context)
          chunk.textMeasures.forEach(({ width, length }) => {
            totalDefaultWidth += width
            totalLength += length
          })
        })

        charSpace = (textLength - totalDefaultWidth) / (totalLength - lengthAdjustment)
      }

      // Put the textchunks
      textChunks.reduce(
        (lastPositions, { type, chunk }) => {
          if (type === 'x') {
            chunk.setX(lastPositions[0])
          } else if (type === 'y') {
            chunk.setY(lastPositions[1])
          }
          return chunk.put(context, charSpace)
        },
        [0, 0]
      )
    }

    context.pdf.restoreGraphicsState()
  }

  isVisible(parentVisible: boolean, context: Context): boolean {
    return svgNodeAndChildrenVisible(this, parentVisible, context)
  }

  protected getBoundingBoxCore(context: Context): Rect {
    return defaultBoundingBox(this.element, context)
  }

  protected computeNodeTransformCore(context: Context): Matrix {
    return context.pdf.unitMatrix
  }
}
