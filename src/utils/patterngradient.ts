import Context from '../context/context'
import { forEachChild, getAttribute } from './node'
import RGBColor from './rgbcolor'
import ReferencesHandler from '../context/referenceshandler'
import AttributeState from '../context/attributestate'
import parse from './parse'

export interface PatternOrGradient {
  key: string
  matrix?: any
  boundingBox?: number[]
  xStep?: number
  yStep?: number
}

// adds a gradient to defs and the pdf document for later use, type is either "axial" or "radial"
// opacity is only supported rudimentary by averaging over all stops
// transforms are applied on use
export function putGradient(
  node: HTMLElement,
  type: string,
  coords: (string | number)[],
  context: Context
) {
  var colors = [] as any
  var opacitySum = 0
  var hasOpacity = false
  var gState
  forEachChild(node, function(i, element) {
    // since opacity gradients are hard to realize, average the opacity over the control points
    if (element.tagName.toLowerCase() === 'stop') {
      var color = new RGBColor(getAttribute(element, 'stop-color'))
      colors.push({
        offset: parseGradientOffset(element.getAttribute('offset')),
        color: [color.r, color.g, color.b]
      })
      var opacity = getAttribute(element, 'stop-opacity')
      if (opacity && opacity !== '1') {
        opacitySum += parseFloat(opacity)
        hasOpacity = true
      }
    }
  })

  if (hasOpacity) {
    gState = new context._pdf.GState({ opacity: opacitySum / colors.length })
  }

  var pattern = new context._pdf.ShadingPattern(type, coords, colors, gState)
  var id = node.getAttribute('id')
  context._pdf.addShadingPattern(id, pattern)
}

/**
 * Convert percentage to decimal
 * @param {string} value
 */
export function parseGradientOffset(value: string) {
  var parsedValue = parseFloat(value)
  if (!isNaN(parsedValue) && value.indexOf('%') >= 0) {
    return parsedValue / 100
  }
  return parsedValue
}

export function pattern(
  node: HTMLElement,
  refsHandler: ReferencesHandler,
  attributeState: AttributeState,
  context: Context
) {
  var id = node.getAttribute('id')
  var nst = parse(node)

  // the transformations directly at the node are written to the pattern transformation matrix
  var bBox = nst.getBBox(context)
  var pattern = new context._pdf.TilingPattern(
    [bBox[0], bBox[1], bBox[0] + bBox[2], bBox[1] + bBox[3]],
    bBox[2],
    bBox[3],
    null,
    context._pdf.unitMatrix /* Utils parameter is ignored !*/
  )

  context._pdf.beginTilingPattern(pattern)
  // continue without transformation

  nst.children.forEach(child =>
    child.render(
      new Context(context._pdf, {
        attributeState: attributeState,
        refsHandler: refsHandler,
        transform: child.computeNodeTransform(context)
      })
    )
  )
  context._pdf.endTilingPattern(id, pattern)
}
