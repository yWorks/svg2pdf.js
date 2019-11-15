import { SvgNode } from './svgnode'
import { Context } from '../context/context'
import { getAttribute } from '../utils/node'
import { parseFloats } from '../utils/math'
import { computeViewBoxTransform } from '../utils/transform'

export abstract class Groups extends SvgNode {
  renderCore(context: Context): void {
    let clonedContext = context.clone({ withinClipPath: false })
    this.children.forEach(child => {
      clonedContext.transform = context._pdf.matrixMult(
        child.computeNodeTransform(context),
        context.transform
      )
      child.render(clonedContext)
    })
  }
  computeNodeTransformCore(context: Context): any {
    const x = parseFloat(getAttribute(this.element, 'x')) || 0
    const y = parseFloat(getAttribute(this.element, 'y')) || 0

    const viewBox = this.element.getAttribute('viewBox')
    let nodeTransform
    if (viewBox) {
      const box = parseFloats(viewBox)
      const width = parseFloat(getAttribute(this.element, 'width')) || box[2]
      const height = parseFloat(getAttribute(this.element, 'height')) || box[3]
      nodeTransform = computeViewBoxTransform(this.element, box, x, y, width, height, context)
    } else {
      nodeTransform = new context._pdf.Matrix(1, 0, 0, 1, x, y)
    }
    return nodeTransform
  }
}
