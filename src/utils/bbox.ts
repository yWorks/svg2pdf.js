import { Context } from '../context/context'
import { getAttribute } from './node'
import { SvgNode } from '../nodes/svgnode'
import { Rect } from './geometry'

export function getBoundingBoxByChildren(context: Context, svgnode: SvgNode): number[] {
  if (getAttribute(svgnode.element, 'display') === 'none') {
    return [0, 0, 0, 0]
  }
  let boundingBox = [0, 0, 0, 0]
  svgnode.children.forEach(child => {
    const nodeBox = child.getBoundingBox(context)
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

export function defaultBoundingBox(element: HTMLElement): Rect {
  const pf: any = parseFloat
  // TODO: check if there are other possible coordinate attributes
  const x1 =
    pf(element.getAttribute('x1')) ||
    pf(getAttribute(element, 'x')) ||
    pf(getAttribute(element, 'cx')) - pf(getAttribute(element, 'r')) ||
    0
  const x2 =
    pf(element.getAttribute('x2')) ||
    x1 + pf(getAttribute(element, 'width')) ||
    pf(getAttribute(element, 'cx')) + pf(getAttribute(element, 'r')) ||
    0
  const y1 =
    pf(element.getAttribute('y1')) ||
    pf(getAttribute(element, 'y')) ||
    pf(getAttribute(element, 'cy')) - pf(getAttribute(element, 'r')) ||
    0
  const y2 =
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
