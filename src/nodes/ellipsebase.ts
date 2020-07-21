import { GeometryNode } from './geometrynode'
import { getAttribute, svgNodeIsVisible } from '../utils/node'
import { Context } from '../context/context'
import { Path } from '../utils/path'
import { SvgNode } from './svgnode'
import { Matrix } from 'jspdf'

export abstract class EllipseBase extends GeometryNode {
  abstract getRx(context: Context): number
  abstract getRy(context: Context): number

  protected constructor(element: Element, children: SvgNode[]) {
    super(false, element, children)
  }

  protected getPath(context: Context): Path | null {
    const rx = this.getRx(context)
    const ry = this.getRy(context)
    if (!isFinite(rx) || ry <= 0 || !isFinite(ry) || ry <= 0) {
      return null
    }

    const x = parseFloat(getAttribute(this.element, context.styleSheets, 'cx') || '0'),
      y = parseFloat(getAttribute(this.element, context.styleSheets, 'cy') || '0')

    const lx = (4 / 3) * (Math.SQRT2 - 1) * rx,
      ly = (4 / 3) * (Math.SQRT2 - 1) * ry
    return new Path()
      .moveTo(x + rx, y)
      .curveTo(x + rx, y - ly, x + lx, y - ry, x, y - ry)
      .curveTo(x - lx, y - ry, x - rx, y - ly, x - rx, y)
      .curveTo(x - rx, y + ly, x - lx, y + ry, x, y + ry)
      .curveTo(x + lx, y + ry, x + rx, y + ly, x + rx, y)
  }

  protected computeNodeTransformCore(context: Context): Matrix {
    return context.pdf.unitMatrix
  }

  isVisible(parentVisible: boolean, context: Context): boolean {
    return svgNodeIsVisible(this, parentVisible, context)
  }
}
