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
  trimLeft,
  trimRight
} from '../utils/text'
import { GraphicsNode } from './graphicsnode'
import { Rect } from '../utils/geometry'
import { Matrix } from 'jspdf'

export class TextNode extends GraphicsNode {
  protected async renderCore(context: Context): Promise<void> {
    context.pdf.saveGraphicsState()

    let xOffset = 0

    const pdfFontSize = context.pdf.getFontSize()
    const textX = toPixels(this.element.getAttribute('x'), pdfFontSize)
    const textY = toPixels(this.element.getAttribute('y'), pdfFontSize)

    const dx = toPixels(this.element.getAttribute('dx'), pdfFontSize)
    const dy = toPixels(this.element.getAttribute('dy'), pdfFontSize)

    const visibility = context.attributeState.visibility
    // when there are no tspans draw the text directly
    const tSpanCount = this.element.childElementCount
    if (tSpanCount === 0) {
      const trimmedText = transformXmlSpace(this.element.textContent || '', context.attributeState)
      const transformedText = transformText(this.element, trimmedText, context)
      xOffset = context.textMeasure.getTextOffset(transformedText, context.attributeState)

      if (visibility === 'visible') {
        const alignmentBaseline = context.attributeState.alignmentBaseline
        const textRenderingMode = getTextRenderingMode(context.attributeState)
        context.pdf.text(transformedText, textX + dx - xOffset, textY + dy, {
          baseline: mapAlignmentBaseline(alignmentBaseline),
          angle: context.transform,
          renderingMode: textRenderingMode === 'fill' ? void 0 : textRenderingMode
        })
      }
    } else {
      // otherwise loop over tspans and position each relative to the previous one
      let currentTextSegment = new TextChunk(
        this,
        context.attributeState.textAnchor,
        textX + dx,
        textY + dy
      )

      for (let i = 0; i < this.element.childNodes.length; i++) {
        const textNode = this.element.childNodes[i] as Element
        if (!textNode.textContent) {
          continue
        }

        let xmlSpace = context.attributeState.xmlSpace
        let textContent = textNode.textContent

        if (textNode.nodeName === '#text') {
        } else if (nodeIs(textNode, 'title')) {
          continue
        } else if (nodeIs(textNode, 'tspan')) {
          const tSpan = textNode

          if (tSpan.childElementCount > 0) {
            // filter <title> elements...
            textContent = ''
            for (let j = 0; j < tSpan.childNodes.length; j++) {
              if (tSpan.childNodes[j].nodeName === '#text') {
                textContent += tSpan.childNodes[j].textContent
              }
            }
          }

          let lastPositions

          const tSpanAbsX = tSpan.getAttribute('x')
          if (tSpanAbsX !== null) {
            const x = toPixels(tSpanAbsX, pdfFontSize)

            lastPositions = currentTextSegment.put(context)
            currentTextSegment = new TextChunk(
              this,
              getAttribute(tSpan, context.styleSheets, 'text-anchor') ||
                context.attributeState.textAnchor,
              x,
              lastPositions[1]
            )
          }

          const tSpanAbsY = tSpan.getAttribute('y')
          if (tSpanAbsY !== null) {
            const y = toPixels(tSpanAbsY, pdfFontSize)

            lastPositions = currentTextSegment.put(context)
            currentTextSegment = new TextChunk(
              this,
              getAttribute(tSpan, context.styleSheets, 'text-anchor') ||
                context.attributeState.textAnchor,
              lastPositions[0],
              y
            )
          }

          const tSpanXmlSpace = tSpan.getAttribute('xml:space')
          if (tSpanXmlSpace) {
            xmlSpace = tSpanXmlSpace
          }
        }

        let trimmedText = removeNewlines(textContent)
        trimmedText = replaceTabsBySpace(trimmedText)

        if (xmlSpace === 'default') {
          if (i === 0) {
            trimmedText = trimLeft(trimmedText)
          }
          if (i === tSpanCount - 1) {
            trimmedText = trimRight(trimmedText)
          }

          trimmedText = consolidateSpaces(trimmedText)
        }

        const transformedText = transformText(this.element, trimmedText, context)
        currentTextSegment.add(textNode, transformedText)
      }

      currentTextSegment.put(context)
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
