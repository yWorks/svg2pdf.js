import NodeStructureTree from './nst'
import Context from '../context/context'
import { defaultBoundingBox, addLineWidth } from '../utils/bbox'
import {
  transformXmlSpace,
  transformText,
  getTextRenderingMode,
  removeNewlines,
  replaceTabsBySpace,
  trimLeft,
  trimRight,
  consolidateSpaces
} from '../utils/text'
import TextChunk from '../textchunk'
import { nodeIs, getAttribute } from '../utils/node'
import { toPixels, mapAlignmentBaseline } from '../utils/misc'

export default class TextAst extends NodeStructureTree {
  renderCore(context: Context): void {
    context._pdf.saveGraphicsState()

    var dx,
      dy,
      xOffset = 0

    var pdfFontSize = context._pdf.getFontSize()
    var textX = toPixels(this.element.getAttribute('x'), pdfFontSize)
    var textY = toPixels(this.element.getAttribute('y'), pdfFontSize)

    dx = toPixels(this.element.getAttribute('dx'), pdfFontSize)
    dy = toPixels(this.element.getAttribute('dy'), pdfFontSize)

    var visibility = context.attributeState.visibility
    // when there are no tspans draw the text directly
    var tSpanCount = this.element.childElementCount
    if (tSpanCount === 0) {
      var trimmedText = transformXmlSpace(this.element.textContent, context.attributeState)
      var transformedText = transformText(this.element, trimmedText)
      xOffset = context.textMeasure.getTextOffset(transformedText, context.attributeState)

      if (visibility === 'visible') {
        var alignmentBaseline = context.attributeState.alignmentBaseline
        var textRenderingMode = getTextRenderingMode(context.attributeState)
        context._pdf.text(transformedText, textX + dx - xOffset, textY + dy, {
          baseline: mapAlignmentBaseline(alignmentBaseline),
          angle: context.transform,
          renderingMode: textRenderingMode === 'fill' ? void 0 : textRenderingMode
        })
      }
    } else {
      // otherwise loop over tspans and position each relative to the previous one
      var currentTextSegment = new TextChunk(
        context.attributeState.textAnchor,
        textX + dx,
        textY + dy
      )

      for (var i = 0; i < this.element.childNodes.length; i++) {
        var textNode = this.element.childNodes[i] as HTMLElement
        if (!textNode.textContent) {
          continue
        }

        var xmlSpace = context.attributeState.xmlSpace
        var textContent = textNode.textContent

        if (textNode.nodeName === '#text') {
        } else if (nodeIs(textNode, 'title')) {
          continue
        } else if (nodeIs(textNode, 'tspan')) {
          var tSpan = textNode

          if (tSpan.childElementCount > 0) {
            // filter <title> elements...
            textContent = ''
            for (var j = 0; j < tSpan.childNodes.length; j++) {
              if (tSpan.childNodes[j].nodeName === '#text') {
                textContent += tSpan.childNodes[j].textContent
              }
            }
          }

          var lastPositions

          var tSpanAbsX = tSpan.getAttribute('x')
          if (tSpanAbsX !== null) {
            var x = toPixels(tSpanAbsX, pdfFontSize)

            lastPositions = currentTextSegment.put(context)
            currentTextSegment = new TextChunk(
              getAttribute(tSpan, 'text-anchor') || context.attributeState.textAnchor,
              x,
              lastPositions[1]
            )
          }

          var tSpanAbsY = tSpan.getAttribute('y')
          if (tSpanAbsY !== null) {
            var y = toPixels(tSpanAbsY, pdfFontSize)

            lastPositions = currentTextSegment.put(context)
            currentTextSegment = new TextChunk(
              getAttribute(tSpan, 'text-anchor') || context.attributeState.textAnchor,
              lastPositions[0],
              y
            )
          }

          var tSpanXmlSpace = tSpan.getAttribute('xml:space')
          if (tSpanXmlSpace) {
            xmlSpace = tSpanXmlSpace
          }
        }

        trimmedText = removeNewlines(textContent)
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

        transformedText = transformText(this.element, trimmedText)
        currentTextSegment.add(textNode, transformedText)
      }

      currentTextSegment.put(context)
    }

    context._pdf.restoreGraphicsState()
  }

  getBoundingBoxCore(context: Context): number[] {
    return addLineWidth(defaultBoundingBox(this.element, context), this.element)
  }

  computeNodeTransformCore(context:Context):any{
    return context._pdf.unitMatrix
  }
}
