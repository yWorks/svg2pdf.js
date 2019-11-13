import RGBColor from './rgbcolor'

import AttributeState from '../context/attributestate'
import Context from '../context/context'

import { parseFloats, mirrorPoint } from './math'
import { iriReference, alignmentBaselineMap, fontAliases } from './constants'
import parse from './parse'
import { nodeIs, getAttribute } from './node'
import { PatternOrGradient } from './patterngradient'
import { parseTransform } from './transform'

/**
 * Convert em, px and bare number attributes to pixel values
 * @param {string} value
 * @param {number} pdfFontSize
 */
export function toPixels(value: string, pdfFontSize: number) {
  var match

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
  var floats = parseFloats(string)
  var result = []
  for (var i = 0; i < floats.length - 1; i += 2) {
    var x = floats[i]
    var y = floats[i + 1]
    result.push([x, y])
  }
  return result
}

export function mapAlignmentBaseline(value: string): string {
  return alignmentBaselineMap[value] || 'alphabetic'
}

// extracts a control point from a previous path segment (for t,T,s,S segments)
export function getControlPointFromPrevious(
  i: number,
  from: number[],
  list: any,
  prevX: number,
  prevY: number
) {
  var prev = list.getItem(i - 1)
  var p2
  if (i > 0 && (prev.pathSegTypeAsLetter === 'C' || prev.pathSegTypeAsLetter === 'S')) {
    p2 = mirrorPoint([prev.x2, prev.y2], from)
  } else if (i > 0 && (prev.pathSegTypeAsLetter === 'c' || prev.pathSegTypeAsLetter === 's')) {
    p2 = mirrorPoint([prev.x2 + prevX, prev.y2 + prevY], from)
  } else {
    p2 = [from[0], from[1]]
  }
  return p2
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
  var fontType = ''
  if (attributeState.fontWeight === 'bold') {
    fontType = 'bold'
  }
  if (attributeState.fontStyle === 'italic') {
    fontType += 'italic'
  }
  if (fontType === '') {
    fontType = 'normal'
  }

  var availableFonts = context._pdf.getFontList()
  var firstAvailable = ''
  var fontIsAvailable = fontFamilies.some(function(font) {
    var availableStyles = availableFonts[font]
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
    var transparent = new RGBColor('rgb(0,0,0)')
    transparent.a = 0
    return transparent
  }

  var match = /\s*rgba\(((?:[^,\)]*,){3}[^,\)]*)\)\s*/.exec(colorString)
  if (match) {
    var floats = parseFloats(match[1])
    var color = new RGBColor('rgb(' + floats.slice(0, 3).join(',') + ')')
    color.a = floats[3]
    return color
  } else {
    return new RGBColor(colorString)
  }
}

export function getFill(fillColor: string, context: Context, element: HTMLElement): any {
  var fillRGB = null,
    patternOrGradient: PatternOrGradient = undefined,
    bBox
  var url = iriReference.exec(fillColor)
  if (url) {
    // probably a gradient or pattern (or something unsupported)
    var fillUrl = url[1]
    var fillNode = context.refsHandler.getRendered(fillUrl, context)
    if (fillNode && nodeIs(fillNode, 'lineargradient,radialgradient')) {
      // matrix to convert between gradient space and user space
      // for "userSpaceOnUse" this is the current transformation: tfMatrix
      // for "objectBoundingBox" or default, the gradient gets scaled and transformed to the bounding box
      var gradientUnitsMatrix
      if (
        !fillNode.hasAttribute('gradientUnits') ||
        fillNode.getAttribute('gradientUnits').toLowerCase() === 'objectboundingbox'
      ) {
        bBox || (bBox = parse(element).getBBox(context))
        gradientUnitsMatrix = new context._pdf.Matrix(bBox[2], 0, 0, bBox[3], bBox[0], bBox[1])
      } else {
        gradientUnitsMatrix = context._pdf.unitMatrix
      }

      // matrix that is applied to the gradient before any other transformations
      var gradientTransform = parseTransform(
        getAttribute(fillNode, 'gradientTransform', 'transform'),
        context
      )

      patternOrGradient = {
        key: fillUrl,
        matrix: context._pdf.matrixMult(gradientTransform, gradientUnitsMatrix)
      }

      return patternOrGradient
    } else if (fillNode && nodeIs(fillNode, 'pattern')) {
      var fillBBox, y, width, height, x
      patternOrGradient = { key: fillUrl }

      var patternUnitsMatrix = context._pdf.unitMatrix
      if (
        !fillNode.hasAttribute('patternUnits') ||
        fillNode.getAttribute('patternUnits').toLowerCase() === 'objectboundingbox'
      ) {
        bBox || (bBox = parse(element).getBBox(context))
        patternUnitsMatrix = new context._pdf.Matrix(1, 0, 0, 1, bBox[0], bBox[1])

        // TODO: slightly inaccurate (rounding errors? line width bBoxes?)
        fillBBox = parse(fillNode).getBBox(context)
        x = fillBBox[0] * bBox[0]
        y = fillBBox[1] * bBox[1]
        width = fillBBox[2] * bBox[2]
        height = fillBBox[3] * bBox[3]
        patternOrGradient.boundingBox = [x, y, x + width, y + height]
        patternOrGradient.xStep = width
        patternOrGradient.yStep = height
      }

      var patternContentUnitsMatrix = context._pdf.unitMatrix
      if (
        fillNode.hasAttribute('patternContentUnits') &&
        fillNode.getAttribute('patternContentUnits').toLowerCase() === 'objectboundingbox'
      ) {
        bBox || (bBox = parse(element).getBBox(context))
        patternContentUnitsMatrix = new context._pdf.Matrix(bBox[2], 0, 0, bBox[3], 0, 0)

        fillBBox = patternOrGradient.boundingBox || parse(fillNode).getBBox(context)
        x = fillBBox[0] / bBox[0]
        y = fillBBox[1] / bBox[1]
        width = fillBBox[2] / bBox[2]
        height = fillBBox[3] / bBox[3]
        patternOrGradient.boundingBox = [x, y, x + width, y + height]
        patternOrGradient.xStep = width
        patternOrGradient.yStep = height
      }

      var patternTransformMatrix = context._pdf.unitMatrix
      if (fillNode.hasAttribute('patternTransform')) {
        patternTransformMatrix = parseTransform(
          getAttribute(fillNode, 'patternTransform', 'transform'),
          context
        )
      }

      var matrix = patternContentUnitsMatrix
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
