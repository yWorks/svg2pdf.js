import { Context } from '../context/context'
import { Path } from '../path'
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

  isVisible(parentVisible: boolean, context:Context): boolean {
    return svgNodeIsVisible(this, parentVisible, context)
  }

  protected computeNodeTransformCore(context: Context): any {
    return context._pdf.unitMatrix
  }
}
