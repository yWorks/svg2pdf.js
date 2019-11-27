import { RGBColor } from './rgbcolor'
import { Context } from '../context/context'

import { parseColor } from './parsing'
import { alignmentBaselineMap, iriReference } from './constants'
import { getAttribute } from './node'
import { PatternOrGradient } from './patterngradient'
import { parseTransform } from './transform'
import { SvgNode } from '../nodes/svgnode'
import { LinearGradient } from '../nodes/lineargradient'
import { RadialGradient } from '../nodes/radialgradient'
import { Pattern } from '../nodes/pattern'

/**
 * Convert em, px and bare number attributes to pixel values
 * @param {string} value
 * @param {number} pdfFontSize
 */
export function toPixels(value: string, pdfFontSize: number): number {
  let match

  // em
  match = value && value.toString().match(/^([\-0-9.]+)em$/)
  if (match) {
    return parseFloat(match[1]) * pdfFontSize
  }

  // pixels
  match = value && value.toString().match(/^([\-0-9.]+)(px|)$/)
  if (match) {
    return parseFloat(match[1])
  }
  return 0
}

export function mapAlignmentBaseline(value: string): string {
  return alignmentBaselineMap[value] || 'alphabetic'
}

export function getFill(fillColor: string, context: Context, svgnode: SvgNode): any {
  let fillRGB: any = null,
    patternOrGradient: PatternOrGradient = undefined,
    bBox
  const url = iriReference.exec(fillColor)
  if (url) {
    // probably a gradient or pattern (or something unsupported)
    const fillUrl = url[1]
    const fillNode = context.refsHandler.getRendered(fillUrl, context)
    if (fillNode && (fillNode instanceof LinearGradient || fillNode instanceof RadialGradient)) {
      // matrix to convert between gradient space and user space
      // for "userSpaceOnUse" this is the current transformation: tfMatrix
      // for "objectBoundingBox" or default, the gradient gets scaled and transformed to the bounding box
      let gradientUnitsMatrix
      if (
        !fillNode.element.hasAttribute('gradientUnits') ||
        fillNode.element.getAttribute('gradientUnits').toLowerCase() === 'objectboundingbox'
      ) {
        bBox || (bBox = svgnode.getBBox(context))
        gradientUnitsMatrix = new context.pdf.Matrix(bBox[2], 0, 0, bBox[3], bBox[0], bBox[1])
      } else {
        gradientUnitsMatrix = context.pdf.unitMatrix
      }

      // matrix that is applied to the gradient before any other transformations
      const gradientTransform = parseTransform(
        getAttribute(fillNode.element, 'gradientTransform', 'transform'),
        context
      )

      patternOrGradient = {
        key: fillUrl,
        matrix: context.pdf.matrixMult(gradientTransform, gradientUnitsMatrix)
      }

      return patternOrGradient
    } else if (fillNode && fillNode instanceof Pattern) {
      let fillBBox, y, width, height, x
      patternOrGradient = { key: fillUrl }

      let patternUnitsMatrix = context.pdf.unitMatrix
      if (
        !fillNode.element.hasAttribute('patternUnits') ||
        fillNode.element.getAttribute('patternUnits').toLowerCase() === 'objectboundingbox'
      ) {
        bBox || (bBox = svgnode.getBBox(context))
        patternUnitsMatrix = new context.pdf.Matrix(1, 0, 0, 1, bBox[0], bBox[1])

        // TODO: slightly inaccurate (rounding errors? line width bBoxes?)
        fillBBox = fillNode.getBBox(context)
        x = fillBBox[0] * bBox[0]
        y = fillBBox[1] * bBox[1]
        width = fillBBox[2] * bBox[2]
        height = fillBBox[3] * bBox[3]
        patternOrGradient.boundingBox = [x, y, x + width, y + height]
        patternOrGradient.xStep = width
        patternOrGradient.yStep = height
      }

      let patternContentUnitsMatrix = context.pdf.unitMatrix
      if (
        fillNode.element.hasAttribute('patternContentUnits') &&
        fillNode.element.getAttribute('patternContentUnits').toLowerCase() === 'objectboundingbox'
      ) {
        bBox || (bBox = svgnode.getBBox(context))
        patternContentUnitsMatrix = new context.pdf.Matrix(bBox[2], 0, 0, bBox[3], 0, 0)

        fillBBox = patternOrGradient.boundingBox || fillNode.getBBox(context)
        x = fillBBox[0] / bBox[0]
        y = fillBBox[1] / bBox[1]
        width = fillBBox[2] / bBox[2]
        height = fillBBox[3] / bBox[3]
        patternOrGradient.boundingBox = [x, y, x + width, y + height]
        patternOrGradient.xStep = width
        patternOrGradient.yStep = height
      }

      let patternTransformMatrix = context.pdf.unitMatrix
      if (fillNode.element.hasAttribute('patternTransform')) {
        patternTransformMatrix = parseTransform(
          getAttribute(fillNode.element, 'patternTransform', 'transform'),
          context
        )
      }

      let matrix = patternContentUnitsMatrix
      matrix = context.pdf.matrixMult(matrix, patternUnitsMatrix)
      matrix = context.pdf.matrixMult(matrix, patternTransformMatrix)
      matrix = context.pdf.matrixMult(matrix, context.transform)

      patternOrGradient.matrix = matrix

      return patternOrGradient
    } else {
      // unsupported fill argument -> fill black
      return new RGBColor('rgb(0, 0, 0)')
    }
  } else {
    // plain color
    fillRGB = parseColor(fillColor)
    if (fillRGB.ok) {
      return fillRGB
    } else if (fillColor === 'none') {
      return null
    }
  }
}
