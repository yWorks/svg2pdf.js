import { SvgNode } from './svgnode'
import { Context } from '../context/context'
import { defaultBoundingBox, addLineWidth } from '../utils/bbox'
import { getAttribute, svgNodeIsVisible } from '../utils/node'

export class Rect extends SvgNode {
  renderCore(context: Context): void {
    if (!context.withinClipPath) {
      context._pdf.setCurrentTransformationMatrix(context.transform)
    }
    const width = parseFloat(getAttribute(this.element, 'width'))
    const height = parseFloat(getAttribute(this.element, 'height'))
    if (!isFinite(width) || width <= 0 || !isFinite(height) || height <= 0) {
      return
    }
    context._pdf.roundedRect(
      parseFloat(getAttribute(this.element, 'x')) || 0,
      parseFloat(getAttribute(this.element, 'y')) || 0,
      width,
      height,
      parseFloat(getAttribute(this.element, 'rx')) || 0,
      parseFloat(getAttribute(this.element, 'ry')) || 0
    )

    this.fillOrStroke(context)
  }

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
