import Context from '../context/context'
import NodeStructureTree from './nst'
import { getBoundingBoxByChildren } from '../utils/bbox'
import { nodeIs, getAttribute } from '../utils/node'
import { parseFloats } from '../utils/math'
import { computeViewBoxTransform } from '../utils/transform'

export default class Group extends NodeStructureTree {
  element: HTMLElement
  parent: NodeStructureTree

  renderCore(context: Context): void {
    var clonedContext = context.clone({ withinClipPath: false })
    this.children.forEach(child => {
      clonedContext.transform = context._pdf.matrixMult(
        child.computeNodeTransform(context),
        context.transform
      )
      child.render(clonedContext)
    })
  }

  getBoundingBoxCore(context: Context): number[] {
    if (nodeIs(this.element, 'svg')) {
      var viewBox = this.element.getAttribute('viewBox'),
        vb
      if (viewBox) {
        vb = parseFloats(viewBox)
      }
      return [
        parseFloat(getAttribute(this.element, 'x')) || (vb && vb[0]) || 0,
        parseFloat(getAttribute(this.element, 'y')) || (vb && vb[1]) || 0,
        parseFloat(getAttribute(this.element, 'width')) || (vb && vb[2]) || 0,
        parseFloat(getAttribute(this.element, 'height')) || (vb && vb[3]) || 0
      ]
    } else {
      return getBoundingBoxByChildren(context, this.element)
    }
  }

  computeNodeTransformCore(context: Context): any {
    var x = parseFloat(getAttribute(this.element, 'x')) || 0
    var y = parseFloat(getAttribute(this.element, 'y')) || 0

    var viewBox = this.element.getAttribute('viewBox')
    if (viewBox) {
      var box = parseFloats(viewBox)
      var width = parseFloat(getAttribute(this.element, 'width')) || box[2]
      var height = parseFloat(getAttribute(this.element, 'height')) || box[3]
      var nodeTransform = computeViewBoxTransform(this.element, box, x, y, width, height, context)
    } else {
      var nodeTransform = new context._pdf.Matrix(1, 0, 0, 1, x, y)
    }
    return nodeTransform
  }
}
