import { AttributeState } from '../context/attributestate'
import { Context } from '../context/context'
import { SvgNode } from '../nodes/svgnode'
import { alignmentBaselineMap, fontAliases, iriReference } from './constants'
import { parseFloats } from './math'
import { getAttribute, nodeIs } from './node'
import { PatternOrGradient } from './patterngradient'
import { RGBColor } from './rgbcolor'
import { parseTransform } from './transform'



/**
 * Convert em, px and bare number attributes to pixel values
 * @param {string} value
 * @param {number} pdfFontSize
 */
export function toPixels(value: string, pdfFontSize: number) {
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

// parses the "points" string used by polygons and returns an array of points
export function parsePointsString(string: string) {
  const floats = parseFloats(string)
  const result = []
  for (let i = 0; i < floats.length - 1; i += 2) {
    const x = floats[i]
    const y = floats[i + 1]
    result.push([x, y])
  }
  return result
}

export function mapAlignmentBaseline(value: string): string {
  return alignmentBaselineMap[value] || 'alphabetic'
}

/**
 * @param {AttributeState} attributeState
 * @param {string[]} fontFamilies
 * @return {string}
 */
export function findFirstAvailableFontFamily(
  attributeState: AttributeState,
  fontFamilies: string[],
  context: Context
) {
  let fontType = ''
  if (attributeState.fontWeight === 'bold') {
    fontType = 'bold'
  }
  if (attributeState.fontStyle === 'italic') {
    fontType += 'italic'
  }
  if (fontType === '') {
    fontType = 'normal'
  }

  const availableFonts = context._pdf.getFontList()
  let firstAvailable = ''
  const fontIsAvailable = fontFamilies.some(font => {
    const availableStyles = availableFonts[font]
    if (availableStyles && availableStyles.indexOf(fontType) >= 0) {
      firstAvailable = font
      return true
    }

    font = font.toLowerCase()
    if (fontAliases.hasOwnProperty(font)) {
      firstAvailable = font
      return true
    }

    return false
  })

  if (!fontIsAvailable) {
    firstAvailable = 'times'
  }

  return firstAvailable
}

// extends RGBColor by rgba colors as RGBColor is not capable of it
export function parseColor(colorString: string) {
  if (colorString === 'transparent') {
    const transparent = new RGBColor('rgb(0,0,0)')
    transparent.a = 0
    return transparent
  }

  const match = /\s*rgba\(((?:[^,\)]*,){3}[^,\)]*)\)\s*/.exec(colorString)
  if (match) {
    const floats = parseFloats(match[1])
    const color = new RGBColor('rgb(' + floats.slice(0, 3).join(',') + ')')
    color.a = floats[3]
    return color
  } else {
    return new RGBColor(colorString)
  }
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
    if (fillNode && nodeIs(fillNode.element, 'lineargradient,radialgradient')) {
      // matrix to convert between gradient space and user space
      // for "userSpaceOnUse" this is the current transformation: tfMatrix
      // for "objectBoundingBox" or default, the gradient gets scaled and transformed to the bounding box
      let gradientUnitsMatrix
      if (
        !fillNode.element.hasAttribute('gradientUnits') ||
        fillNode.element.getAttribute('gradientUnits').toLowerCase() === 'objectboundingbox'
      ) {
        bBox || (bBox = svgnode.getBBox(context))
        gradientUnitsMatrix = new context._pdf.Matrix(bBox[2], 0, 0, bBox[3], bBox[0], bBox[1])
      } else {
        gradientUnitsMatrix = context._pdf.unitMatrix
      }

      // matrix that is applied to the gradient before any other transformations
      const gradientTransform = parseTransform(
        getAttribute(fillNode.element, ['gradientTransform', 'transform'], context.styleSheets),
        context
      )

      patternOrGradient = {
        key: fillUrl,
        matrix: context._pdf.matrixMult(gradientTransform, gradientUnitsMatrix)
      }

      return patternOrGradient
    } else if (fillNode && nodeIs(fillNode.element, 'pattern')) {
      let fillBBox, y, width, height, x
      patternOrGradient = { key: fillUrl }

      let patternUnitsMatrix = context._pdf.unitMatrix
      if (
        !fillNode.element.hasAttribute('patternUnits') ||
        fillNode.element.getAttribute('patternUnits').toLowerCase() === 'objectboundingbox'
      ) {
        bBox || (bBox = svgnode.getBBox(context))
        patternUnitsMatrix = new context._pdf.Matrix(1, 0, 0, 1, bBox[0], bBox[1])

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

      let patternContentUnitsMatrix = context._pdf.unitMatrix
      if (
        fillNode.element.hasAttribute('patternContentUnits') &&
        fillNode.element.getAttribute('patternContentUnits').toLowerCase() === 'objectboundingbox'
      ) {
        bBox || (bBox = svgnode.getBBox(context))
        patternContentUnitsMatrix = new context._pdf.Matrix(bBox[2], 0, 0, bBox[3], 0, 0)

        fillBBox = patternOrGradient.boundingBox || fillNode.getBBox(context)
        x = fillBBox[0] / bBox[0]
        y = fillBBox[1] / bBox[1]
        width = fillBBox[2] / bBox[2]
        height = fillBBox[3] / bBox[3]
        patternOrGradient.boundingBox = [x, y, x + width, y + height]
        patternOrGradient.xStep = width
        patternOrGradient.yStep = height
      }

      let patternTransformMatrix = context._pdf.unitMatrix
      if (fillNode.element.hasAttribute('patternTransform')) {
        patternTransformMatrix = parseTransform(
          getAttribute(fillNode.element, ['patternTransform', 'transform'], context.styleSheets),
          context
        )
      }

      let matrix = patternContentUnitsMatrix
      matrix = context._pdf.matrixMult(matrix, patternUnitsMatrix)
      matrix = context._pdf.matrixMult(matrix, patternTransformMatrix)
      matrix = context._pdf.matrixMult(matrix, context.transform)

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
