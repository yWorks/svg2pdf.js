import { Context } from '../context/context'
import { parseFloats } from '../utils/parsing'
import { computeViewBoxTransform } from '../utils/transform'
import { NonRenderedNode } from './nonrenderednode'
import { svgNodeAndChildrenVisible } from '../utils/node'
import { Rect } from '../utils/geometry'

export class MarkerNode extends NonRenderedNode {
  async apply(parentContext: Context): Promise<void> {
    // the transformations directly at the node are written to the pdf form object transformation matrix
    const tfMatrix = this.computeNodeTransform(parentContext)
    const bBox = this.getBoundingBox(parentContext)
    const context = new Context(parentContext.pdf, {
      refsHandler: parentContext.refsHandler,
      transform: tfMatrix
    })

    context.pdf.beginFormObject(bBox[0], bBox[1], bBox[2], bBox[3], tfMatrix)
    for (const child of this.children) {
      await child.render(
        new Context(context.pdf, {
          refsHandler: context.refsHandler
        })
      )
    }
    context.pdf.endFormObject(this.element.getAttribute('id'))
  }

  protected getBoundingBoxCore(context: Context): Rect {
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

  protected computeNodeTransformCore(context: Context): any {
    const refX = parseFloat(this.element.getAttribute('refX')) || 0
    const refY = parseFloat(this.element.getAttribute('refY')) || 0

    const viewBox = this.element.getAttribute('viewBox')
    let nodeTransform
    if (viewBox) {
      const bounds = parseFloats(viewBox)
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
      nodeTransform = context.pdf.matrixMult(
        new context.pdf.Matrix(1, 0, 0, 1, -refX, -refY),
        nodeTransform
      )
    } else {
      nodeTransform = new context.pdf.Matrix(1, 0, 0, 1, -refX, -refY)
    }
    return nodeTransform
  }

  isVisible(parentVisible: boolean): boolean {
    return svgNodeAndChildrenVisible(this, parentVisible)
  }
}
