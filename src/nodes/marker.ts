import { Context } from '../context/context'
import { parseFloats } from '../utils/math'
import { computeViewBoxTransform } from '../utils/transform'
import { NonRenderedNode } from './nonrenderednode'
import { svgNodeAndChildrenVisible } from '../utils/node'

export class MarkerNode extends NonRenderedNode {
  apply(contextIn: Context): void {
    // the transformations directly at the node are written to the pdf form object transformation matrix
    const tfMatrix = this.computeNodeTransform(contextIn)
    const bBox = this.getBBox(contextIn)
    let context = new Context(contextIn._pdf, {
      refsHandler: contextIn.refsHandler,
      transform: tfMatrix
    })

    context._pdf.beginFormObject(bBox[0], bBox[1], bBox[2], bBox[3], tfMatrix)
    this.children.forEach(child =>
      child.render(
        new Context(context._pdf, {
          refsHandler: context.refsHandler,
          transform: child.computeNodeTransform(context)
        })
      )
    )
    context._pdf.endFormObject(this.element.getAttribute('id'))
  }

  getBoundingBoxCore(context: Context): number[] {
    const viewBox = this.element.getAttribute('viewBox')
    let vb
    if (viewBox) {
      vb = parseFloats(viewBox)
    }
    return [
      (vb && vb[0]) || 0,
      (vb && vb[1]) || 0,
      (vb && vb[2]) || parseFloat(this.element.getAttribute('marker-width')) || 0,
      (vb && vb[3]) || parseFloat(this.element.getAttribute('marker-height')) || 0
    ]
  }

  computeNodeTransformCore(context: Context): any {
    const x = parseFloat(this.element.getAttribute('refX')) || 0
    const y = parseFloat(this.element.getAttribute('refY')) || 0

    const viewBox = this.element.getAttribute('viewBox')
    let nodeTransform
    if (viewBox) {
      let bounds = parseFloats(viewBox)
      bounds[0] = bounds[1] = 0 // for some reason vbX anc vbY seem to be ignored for markers
      nodeTransform = computeViewBoxTransform(
        this.element,
        bounds,
        0,
        0,
        parseFloat(this.element.getAttribute('markerWidth')) || 3,
        parseFloat(this.element.getAttribute('markerHeight')) || 3,
        context
      )
      nodeTransform = context._pdf.matrixMult(
        new context._pdf.Matrix(1, 0, 0, 1, -x, -y),
        nodeTransform
      )
    } else {
      nodeTransform = new context._pdf.Matrix(1, 0, 0, 1, -x, -y)
    }
    return nodeTransform
  }
  isVisible(parentVisible: boolean): boolean {
    return svgNodeAndChildrenVisible(this, parentVisible)
  }
}
