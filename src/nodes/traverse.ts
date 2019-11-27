import { Context } from '../context/context'
import { Path } from '../utils/path'
import { svgNodeIsVisible } from '../utils/node'
import { GeometryNode } from './geometrynode'
import { SvgNode } from './svgnode'
import { parsePointsString } from '../utils/parsing'

export abstract class Traverse extends GeometryNode {
  private readonly closed: boolean

  protected constructor(closed: boolean, node: HTMLElement, children: SvgNode[]) {
    super(true, node, children)
    this.closed = closed
  }

  protected getPath(context: Context): Path {
    if (!this.element.hasAttribute('points') || this.element.getAttribute('points') === '') {
      return null
    }

    const points = parsePointsString(this.element.getAttribute('points'))

    const path = new Path()

    if (points.length < 1) {
      return path
    }

    path.moveTo(points[0][0], points[0][1])

    for (let i = 1; i < points.length; i++) {
      path.lineTo(points[i][0], points[i][1])
    }

    if (this.closed) {
      path.close()
    }

    return path
  }

  isVisible(parentVisible: boolean): boolean {
    return svgNodeIsVisible(this, parentVisible)
  }

  protected computeNodeTransformCore(context: Context): any {
    return context.pdf.unitMatrix
  }
}
