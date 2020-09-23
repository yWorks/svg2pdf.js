import { Context } from '../context/context'
import { parseFloats } from '../utils/parsing'
import { computeViewBoxTransform } from '../utils/transform'
import { NonRenderedNode } from './nonrenderednode'
import { svgNodeAndChildrenVisible } from '../utils/node'
import { Rect } from '../utils/geometry'
import { Matrix } from 'jspdf'

export class MarkerNode extends NonRenderedNode {
  async apply(parentContext: Context): Promise<void> {
    // the transformations directly at the node are written to the pdf form object transformation matrix
    const tfMatrix = this.computeNodeTransform(parentContext)
    const bBox = this.getBoundingBox(parentContext)

    parentContext.pdf.beginFormObject(bBox[0], bBox[1], bBox[2], bBox[3], tfMatrix)
    for (const child of this.children) {
      await child.render(
        new Context(parentContext.pdf, {
          refsHandler: parentContext.refsHandler,
          styleSheets: parentContext.styleSheets,
          viewport: parentContext.viewport,
          svg2pdfParameters: parentContext.svg2pdfParameters
        })
      )
    }
    parentContext.pdf.endFormObject(this.element.getAttribute('id'))
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getBoundingBoxCore(context: Context): Rect {
    const viewBox = this.element.getAttribute('viewBox')
    let vb
    if (viewBox) {
      vb = parseFloats(viewBox)
    }
    return [
      (vb && vb[0]) || 0,
      (vb && vb[1]) || 0,
      (vb && vb[2]) || parseFloat(this.element.getAttribute('marker-width') || '0'),
      (vb && vb[3]) || parseFloat(this.element.getAttribute('marker-height') || '0')
    ]
  }

  protected computeNodeTransformCore(context: Context): Matrix {
    const refX = parseFloat(this.element.getAttribute('refX') || '0')
    const refY = parseFloat(this.element.getAttribute('refY') || '0')

    const viewBox = this.element.getAttribute('viewBox')
    let nodeTransform
    if (viewBox) {
      const bounds = parseFloats(viewBox)
      // "Markers are drawn such that their reference point (i.e., attributes ‘refX’ and ‘refY’)
      // is positioned at the given vertex." - The "translate" part of the viewBox transform is
      // ignored.
      nodeTransform = computeViewBoxTransform(
        this.element,
        bounds,
        0,
        0,
        parseFloat(this.element.getAttribute('markerWidth') || '3'),
        parseFloat(this.element.getAttribute('markerHeight') || '3'),
        context,
        true
      )
      nodeTransform = context.pdf.matrixMult(
        context.pdf.Matrix(1, 0, 0, 1, -refX, -refY),
        nodeTransform
      )
    } else {
      nodeTransform = context.pdf.Matrix(1, 0, 0, 1, -refX, -refY)
    }
    return nodeTransform
  }
  isVisible(parentVisible: boolean, context: Context): boolean {
    return svgNodeAndChildrenVisible(this, parentVisible, context)
  }
}
