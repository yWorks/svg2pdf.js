import NodeStructureTree from './nst'
import Context from '../context/context'
import { defaultBoundingBox, addLineWidth } from '../utils/bbox'
import { getAttribute } from '../utils/node'

export default class Rect extends NodeStructureTree {
  renderCore(context: Context): void {
    if (!context.withinClipPath) {
      context._pdf.setCurrentTransformationMatrix(context.transform)
    }
    var width = parseFloat(getAttribute(this.element, 'width'))
    var height = parseFloat(getAttribute(this.element, 'height'))
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
  }

  getBoundingBoxCore(context: Context): number[] {
    return addLineWidth(defaultBoundingBox(this.element, context), this.element)
  }

  computeNodeTransformCore(context:Context):any{
    return context._pdf.unitMatrix
  }
}
