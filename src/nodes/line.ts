import { Context } from '../context/context'
import { Path } from '../utils/path'
import { svgNodeIsVisible } from '../utils/node'
import { GeometryNode } from './geometrynode'
import { SvgNode } from './svgnode'

export class Line extends GeometryNode {
  constructor(node: HTMLElement, children: SvgNode[]) {
    super(true, node, children)
  }

  protected getPath(context: Context): Path {
    if (context.withinClipPath || context.attributeState.stroke === null) {
      return null
    }

    const x1 = parseFloat(this.element.getAttribute('x1')) || 0,
      y1 = parseFloat(this.element.getAttribute('y1')) || 0

    const x2 = parseFloat(this.element.getAttribute('x2')) || 0,
      y2 = parseFloat(this.element.getAttribute('y2')) || 0

    if (!(x1 || x2 || y1 || y2)) {
      return null
    }
    return new Path().moveTo(x1, y1).lineTo(x2, y2)
  }

  protected computeNodeTransformCore(context: Context): any {
    return context.pdf.unitMatrix
  }

  isVisible(parentVisible: boolean): boolean {
    return svgNodeIsVisible(this, parentVisible)
  }

  protected async fillOrStroke(context: Context): Promise<void> {
    context.attributeState.fill = null
    await super.fillOrStroke(context)
  }
}
