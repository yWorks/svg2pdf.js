import { Context } from '../context/context'
import { defaultBoundingBox } from '../utils/bbox'
import { NonRenderedNode } from './nonrenderednode'
import { svgNodeAndChildrenVisible } from '../utils/node'
import { Rect } from '../utils/geometry'
import { Matrix, TilingPattern } from 'jspdf'

export class Pattern extends NonRenderedNode {
  async apply(context: Context): Promise<void> {
    const id = this.element.getAttribute('id')
    if (!id) {
      return
    }

    const scaleFactor = context.pdf.internal.scaleFactor

    // the transformations directly at the node are written to the pattern transformation matrix
    const x = context.svg2pdfParameters.x ?? 0
    const y = context.svg2pdfParameters.y ?? 0
    const [patternX, patternY, width, height] = this.getBoundingBox(context)
    const startX = (patternX + x) * scaleFactor
    const startY = (patternY + y) * scaleFactor
    const endX = startX + width * scaleFactor
    const endY = startY + height * scaleFactor
    const pattern = new TilingPattern(
      [startX, startY, endX, endY],
      width * scaleFactor,
      height * scaleFactor
    )

    context.pdf.beginTilingPattern(pattern)
    // continue without transformation

    for (const child of this.children) {
      const childContext = new Context(context.pdf, {
        attributeState: context.attributeState,
        refsHandler: context.refsHandler,
        styleSheets: context.styleSheets,
        viewport: context.viewport,
        svg2pdfParameters: context.svg2pdfParameters,
        transform: context.pdf.Matrix(scaleFactor, 0, 0, scaleFactor, startX, startY)
      })
      await child.render(childContext)
    }
    context.pdf.endTilingPattern(id, pattern)
  }

  protected getBoundingBoxCore(context: Context): Rect {
    return defaultBoundingBox(this.element, context)
  }

  protected computeNodeTransformCore(context: Context): Matrix {
    return context.pdf.unitMatrix
  }

  isVisible(parentVisible: boolean, context: Context): boolean {
    return svgNodeAndChildrenVisible(this, parentVisible, context)
  }
}
