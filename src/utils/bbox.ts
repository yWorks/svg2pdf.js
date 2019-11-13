import Context from '../context/context'
import { forEachChild, getAttribute } from './node'
import parse from './parse'

export function addLineWidth(bBox: number[], element: HTMLElement): number[] {
  // add line-width
  var lineWidth = parseFloat(getAttribute(element, 'stroke-width')) || 1
  var miterLimit = getAttribute(element, 'stroke-miterlimit')
  // miterLength / lineWidth = 1 / sin(phi / 2)
  miterLimit && (lineWidth *= 0.5 / Math.sin(Math.PI / 12))
  return [
    bBox[0] - lineWidth,
    bBox[1] - lineWidth,
    bBox[2] + 2 * lineWidth,
    bBox[3] + 2 * lineWidth
  ]
}

export function getBoundingBoxByChildren(context: Context, element: HTMLElement): number[] {
  if (getAttribute(element, 'display') === 'none') {
    return [0, 0, 0, 0]
  }
  var boundingBox = [0, 0, 0, 0]
  forEachChild(element, function(i, node) {
    var nodeBox = parse(node).getBBox(context)
    boundingBox = [
      Math.min(boundingBox[0], nodeBox[0]),
      Math.min(boundingBox[1], nodeBox[1]),
      Math.max(boundingBox[0] + boundingBox[2], nodeBox[0] + nodeBox[2]) -
        Math.min(boundingBox[0], nodeBox[0]),
      Math.max(boundingBox[1] + boundingBox[3], nodeBox[1] + nodeBox[3]) -
        Math.min(boundingBox[1], nodeBox[1])
    ]
  })
  return boundingBox
}

export function defaultBoundingBox(element: HTMLElement, context: Context): number[] {
  var pf = parseFloat
  // TODO: check if there are other possible coordinate attributes
  var x1 =
    pf(element.getAttribute('x1')) ||
    pf(getAttribute(element, 'x')) ||
    pf(getAttribute(element, 'cx')) - pf(getAttribute(element, 'r')) ||
    0
  var x2 =
    pf(element.getAttribute('x2')) ||
    x1 + pf(getAttribute(element, 'width')) ||
    pf(getAttribute(element, 'cx')) + pf(getAttribute(element, 'r')) ||
    0
  var y1 =
    pf(element.getAttribute('y1')) ||
    pf(getAttribute(element, 'y')) ||
    pf(getAttribute(element, 'cy')) - pf(getAttribute(element, 'r')) ||
    0
  var y2 =
    pf(element.getAttribute('y2')) ||
    y1 + pf(getAttribute(element, 'height')) ||
    pf(getAttribute(element, 'cy')) + pf(getAttribute(element, 'r')) ||
    0
  return [
    Math.min(x1, x2),
    Math.min(y1, y2),
    Math.max(x1, x2) - Math.min(x1, x2),
    Math.max(y1, y2) - Math.min(y1, y2)
  ]
}
