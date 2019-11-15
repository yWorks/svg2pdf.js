import { SvgNode } from './svgnode'
import { Context } from '../context/context'
import { defaultBoundingBox, addLineWidth } from '../utils/bbox'
import { getAttribute } from '../utils/node'

export class Ellipse extends SvgNode {
  rx: number
  ry: number

  constructor(node: HTMLElement, children: SvgNode[]) {
    super(node, children)
    this.rx = parseFloat(getAttribute(this.element, 'rx'))
    this.ry = parseFloat(getAttribute(this.element, 'ry'))
  }

  renderCore(context: Context): void {
    if (!context.withinClipPath) {
      context._pdf.setCurrentTransformationMatrix(context.transform)
    }

    if (!isFinite(this.rx) || this.rx <= 0 || !isFinite(this.ry) || this.ry <= 0) {
      return
    }

    context._pdf.ellipse(
      parseFloat(getAttribute(this.element, 'cx')) || 0,
      parseFloat(getAttribute(this.element, 'cy')) || 0,
      this.rx,
      this.ry
    )
  }
  getBoundingBoxCore(context: Context): number[] {
    return addLineWidth(defaultBoundingBox(this.element, context), this.element)
  }

  computeNodeTransformCore(context: Context): any {
    return context._pdf.unitMatrix
  }
}
