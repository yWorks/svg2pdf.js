import { SvgNode } from './svgnode'
import { Context } from '../context/context'
import { defaultBoundingBox, addLineWidth } from '../utils/bbox'
import { getAttribute, svgNodeIsVisible } from '../utils/node'
import { GeometryNode } from './geometrynode'
import { Path } from '../path'

export class Ellipse extends GeometryNode {
  rx: number
  ry: number

  constructor(node: HTMLElement, children: SvgNode[]) {
    super(node, children)
    this.rx = parseFloat(getAttribute(this.element, 'rx'))
    this.ry = parseFloat(getAttribute(this.element, 'ry'))
  }

  getPath(context: Context) {
    if (!isFinite(this.rx) || this.rx <= 0 || !isFinite(this.ry) || this.ry <= 0) {
      return null
    }

    const x = parseFloat(getAttribute(this.element, 'cx')) || 0,
      y = parseFloat(getAttribute(this.element, 'cy')) || 0

    const lx = (4 / 3) * (Math.SQRT2 - 1) * this.rx,
      ly = (4 / 3) * (Math.SQRT2 - 1) * this.ry
    return new Path()
      .moveTo(x + this.rx, y)
      .curveTo(x + this.rx, y - ly, x + lx, y - this.ry, x, y - this.ry)
      .curveTo(x - lx, y - this.ry, x - this.rx, y - ly, x - this.rx, y)
      .curveTo(x - this.rx, y + ly, x - lx, y + this.ry, x, y + this.ry)
      .curveTo(x + lx, y + this.ry, x + this.rx, y + ly, x + this.rx, y)
  }
  drawMarker(context: Context) {}
  getBoundingBoxCore(context: Context): number[] {
    return addLineWidth(defaultBoundingBox(this.element, context), this.element)
  }

  computeNodeTransformCore(context: Context): any {
    return context._pdf.unitMatrix
  }

  isVisible(parentVisible: boolean): boolean {
    return svgNodeIsVisible(this, parentVisible)
  }
}
