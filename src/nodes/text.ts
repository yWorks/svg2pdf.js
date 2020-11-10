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
    let charSpace = 0
    // If string starts with (\n\r | \t | ' ') then for charSpace calculations
    // need to treat the string as if it contains one extra character
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
      const originalText = this.element.textContent || ''
      const trimmedText = transformXmlSpace(originalText, context.attributeState)
      const transformedText = transformText(this.element, trimmedText, context)
      xOffset = context.textMeasure.getTextOffset(transformedText, context.attributeState)

      if (textLength > 0) {
        const defaultSize = context.textMeasure.measureTextWidth(
          transformedText,
          context.attributeState
        )
        if (context.attributeState.xmlSpace === 'default' && originalText.match(/^\s/)) {
          lengthAdjustment = 0
        }
        charSpace = (textLength - defaultSize) / (transformedText.length - lengthAdjustment) || 0
      }

      if (visibility === 'visible') {
        const alignmentBaseline = context.attributeState.alignmentBaseline
        const textRenderingMode = getTextRenderingMode(context.attributeState)
        context.pdf.text(transformedText, textX + dx - xOffset, textY + dy, {
          baseline: mapAlignmentBaseline(alignmentBaseline),
          angle: context.transform,
          renderingMode: textRenderingMode === 'fill' ? void 0 : textRenderingMode,
          charSpace: charSpace === 0 ? void 0 : charSpace
        })
      }
    } else {
      // otherwise loop over tspans and position each relative to the previous one
      // type sets how the chunk uses the position of the previous chunk to define its origin
      // x/y means it uses the x/y position of the previous to set it's x/y origin repectively
      const textChunks: { type: 'x' | 'y' | ''; chunk: TextChunk }[] = []

      let currentTextSegment = new TextChunk(
        this,
        context.attributeState.textAnchor,
        textX + dx,
        textY + dy
      )
      textChunks.push({ type: '', chunk: currentTextSegment })

      for (let i = 0; i < this.element.childNodes.length; i++) {
        const textNode = this.element.childNodes[i] as Element
        if (!textNode.textContent) {
          continue
        }

        const originalText = textNode.textContent

        let xmlSpace = context.attributeState.xmlSpace
        let textContent = originalText

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
            if (originalText.match(/^\s/)) {
              lengthAdjustment = 0
            }
          }
          if (i === this.element.childNodes.length - 1) {
            trimmedText = trimRight(trimmedText)
          }

          trimmedText = consolidateSpaces(trimmedText)
        }

        const transformedText = transformText(this.element, trimmedText, context)
        currentTextSegment.add(textNode, transformedText)
      }

      // These arrays are (from inside out) per text per TextChunk
      const measures: { width: number; length: number }[][] = []
      let textWidths: number[][] | null = null

      if (textLength > 0) {
        // Calculate the total 'default' width of this text element
        let totalDefaultWidth = 0
        let totalLength = 0
        textChunks.forEach(({ chunk }) => {
          const chunkMeasures = chunk.measureTexts(context)
          measures.push(chunkMeasures)
          chunkMeasures.forEach(({ width, length }) => {
            totalDefaultWidth += width
            totalLength += length
          })
        })

        charSpace = (textLength - totalDefaultWidth) / (totalLength - lengthAdjustment)

        textWidths = measures.map(chunkMeasures =>
          chunkMeasures.map(textMeasure => textMeasure.width + textMeasure.length * charSpace)
        )
      }

      // Put the textchunks
      textChunks.reduce(
        (lastPositions, { type, chunk }, i) => {
          if (type === 'x') {
            chunk.setX(lastPositions[0])
          } else if (type === 'y') {
            chunk.setY(lastPositions[1])
          }
          return chunk.put(context, charSpace, textWidths ? textWidths[i] : null)
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
