import { Context } from '../context/context'
import { Path } from '../path'
import { svgNodeIsVisible } from '../utils/node'
import { GeometryNode } from './geometrynode'
import { SvgNode } from './svgnode'

export class Line extends GeometryNode {
  constructor(node: HTMLElement, children: SvgNode[]) {
    super(node, children)
    this.hasMarker = true
  }
  protected getPath(context: Context) {
    if (!context.withinClipPath) {
      const x1 = parseFloat(this.element.getAttribute('x1')) || 0,
        y1 = parseFloat(this.element.getAttribute('y1')) || 0

      const x2 = parseFloat(this.element.getAttribute('x2')) || 0,
        y2 = parseFloat(this.element.getAttribute('y2')) || 0

      if (context.attributeState.stroke !== null && (x1 || x2 || y1 || y2)) {
        return new Path().moveTo(x1, y1).lineTo(x2, y2)
      }
    }
    return null
  }

  protected computeNodeTransformCore(context: Context): any {
    return context._pdf.unitMatrix
  }

  isVisible(parentVisible: boolean): boolean {
    return svgNodeIsVisible(this, parentVisible)
  }

  protected fillOrStroke(context: Context) {
    context.attributeState.fill = null
    super.fillOrStroke(context)
  }
}
