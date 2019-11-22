import { Context } from '../context/context'
import { forEachChild, getAttribute } from './node'
import { RGBColor } from './rgbcolor'

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
  const colors = [] as any
  let opacitySum = 0
  let hasOpacity = false
  let gState
  forEachChild(node, function(i, element) {
    // since opacity gradients are hard to realize, average the opacity over the control points
    if (element.tagName.toLowerCase() === 'stop') {
      const color = new RGBColor(getAttribute(element, 'stop-color', context.styleSheets))
      colors.push({
        offset: parseGradientOffset(element.getAttribute('offset')),
        color: [color.r, color.g, color.b]
      })
      const opacity = getAttribute(element, 'stop-opacity', context.styleSheets)
      if (opacity && opacity !== '1') {
        opacitySum += parseFloat(opacity)
        hasOpacity = true
      }
    }
  })

  if (hasOpacity) {
    gState = new context._pdf.GState({ opacity: opacitySum / colors.length })
  }

  const pattern = new context._pdf.ShadingPattern(type, coords, colors, gState)
  const id = node.getAttribute('id')
  context._pdf.addShadingPattern(id, pattern)
}

/**
 * Convert percentage to decimal
 * @param {string} value
 */
export function parseGradientOffset(value: string) {
  const parsedValue = parseFloat(value)
  if (!isNaN(parsedValue) && value.indexOf('%') >= 0) {
    return parsedValue / 100
  }
  return parsedValue
}
