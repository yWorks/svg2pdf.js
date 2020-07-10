import { GeometryNode } from './geometrynode'
import { getAttribute, svgNodeIsVisible } from '../utils/node'
import { Context } from '../context/context'
import { Path } from '../utils/path'
import { SvgNode } from './svgnode'
import { Matrix } from 'jspdf'

export abstract class EllipseBase extends GeometryNode {
  abstract get rx(): number
  abstract get ry(): number

  protected constructor(element: HTMLElement, children: SvgNode[]) {
    super(false, element, children)
  }

  protected getPath(context: Context): Path | null {
    if (!isFinite(this.rx) || this.rx <= 0 || !isFinite(this.ry) || this.ry <= 0) {
      return null
    }

    const x = parseFloat(getAttribute(this.element, 'cx') || '0'),
      y = parseFloat(getAttribute(this.element, 'cy') || '0')

    const lx = (4 / 3) * (Math.SQRT2 - 1) * this.rx,
      ly = (4 / 3) * (Math.SQRT2 - 1) * this.ry
    return new Path()
      .moveTo(x + this.rx, y)
      .curveTo(x + this.rx, y - ly, x + lx, y - this.ry, x, y - this.ry)
      .curveTo(x - lx, y - this.ry, x - this.rx, y - ly, x - this.rx, y)
      .curveTo(x - this.rx, y + ly, x - lx, y + this.ry, x, y + this.ry)
      .curveTo(x + lx, y + this.ry, x + this.rx, y + ly, x + this.rx, y)
  }

  protected computeNodeTransformCore(context: Context): Matrix {
    return context.pdf.unitMatrix
  }

  isVisible(parentVisible: boolean): boolean {
    return svgNodeIsVisible(this, parentVisible)
  }
}
