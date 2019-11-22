import { Context } from '../context/context'
import { getAttribute } from './node'
import { multVecMatrix } from './math'
import { SvgNode } from '../nodes/svgnode'

export function addLineWidth(bBox: number[], element: HTMLElement): number[] {
  // add line-width
  let lineWidth = parseFloat(getAttribute(element, 'stroke-width')) || 1
  const miterLimit = getAttribute(element, 'stroke-miterlimit')
  // miterLength / lineWidth = 1 / sin(phi / 2)
  miterLimit && (lineWidth *= 0.5 / Math.sin(Math.PI / 12))
  return [
    bBox[0] - lineWidth,
    bBox[1] - lineWidth,
    bBox[2] + 2 * lineWidth,
    bBox[3] + 2 * lineWidth
  ]
}

export function getBoundingBoxByChildren(context: Context, svgnode: SvgNode): number[] {
  if (getAttribute(svgnode.element, 'display') === 'none') {
    return [0, 0, 0, 0]
  }
  let boundingBox = [0, 0, 0, 0]
  svgnode.children.forEach(child => {
    const nodeBox = child.getBBox(context)
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
  const pf = parseFloat
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

// transforms a bounding box and returns a new rect that contains it
export function transformBBox(box: number[], matrix: any) {
  const bl = multVecMatrix([box[0], box[1]], matrix)
  const br = multVecMatrix([box[0] + box[2], box[1]], matrix)
  const tl = multVecMatrix([box[0], box[1] + box[3]], matrix)
  const tr = multVecMatrix([box[0] + box[2], box[1] + box[3]], matrix)

  const bottom = Math.min(bl[1], br[1], tl[1], tr[1])
  const left = Math.min(bl[0], br[0], tl[0], tr[0])
  const top = Math.max(bl[1], br[1], tl[1], tr[1])
  const right = Math.max(bl[0], br[0], tl[0], tr[0])

  return [left, bottom, right - left, top - bottom]
}
