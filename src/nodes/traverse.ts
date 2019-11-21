import { Context } from '../context/context'
import { Path } from '../path'
import { addLineWidth } from '../utils/bbox'
import { parsePointsString } from '../utils/misc'
import { svgNodeIsVisible } from '../utils/node'
import { GeometryNode } from './geometrynode'
import { SvgNode } from './svgnode'

export abstract class Traverse extends GeometryNode {
  closed: boolean

  constructor(node: HTMLElement, children: SvgNode[], closed: boolean) {
    super(node, children)
    this.closed = closed
    this.hasMarker = true
  }

  protected getPath(context: Context) {
    if (!this.element.hasAttribute('points') || this.element.getAttribute('points') === '') {
      return null
    }

    const points = parsePointsString(this.element.getAttribute('points'))

    const path = new Path().moveTo(points[0][0], points[0][1])
    for (let i = 1; i < points.length; i++) {
      path.lineTo(points[i][0], points[i][1])
    }

    this.closed && path.close()

    return path
  }

  isVisible(parentVisible: boolean): boolean {
    return svgNodeIsVisible(this, parentVisible)
  }

  protected getBoundingBoxCore(context: Context): number[] {
    const points = parsePointsString(this.element.getAttribute('points'))
    let minX = Number.POSITIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY
    for (let i = 0; i < points.length; i++) {
      const point = points[i]
      minX = Math.min(minX, point[0])
      maxX = Math.max(maxX, point[0])
      minY = Math.min(minY, point[1])
      maxY = Math.max(maxY, point[1])
    }
    return addLineWidth([minX, minY, maxX - minX, maxY - minY], this.element)
  }

  protected computeNodeTransformCore(context: Context): any {
    return context._pdf.unitMatrix
  }
}
