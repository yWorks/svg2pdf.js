import { Context } from '../context/context'
import { addLineWidth, defaultBoundingBox } from '../utils/bbox'
import { getAttribute, svgNodeIsVisible } from '../utils/node'
import { GraphicsNode } from './graphicsnode'
import { Rect } from '../utils/geometry'

/**
 * Draws the element referenced by a use node, makes use of pdf's XObjects/FormObjects so nodes are only written once
 * to the pdf document. This highly reduces the file size and computation time.
 */
export class Use extends GraphicsNode {
  protected async renderCore(context: Context): Promise<void> {
    const url = this.element.getAttribute('href') || this.element.getAttribute('xlink:href')
    // just in case someone has the idea to use empty use-tags, wtf???
    if (!url) return

    // get the size of the referenced form object (to apply the correct scaling)
    const id = url.substring(1)
    await context.refsHandler.getRendered(id, context)
    const formObject = context.pdf.getFormObject(id)

    // scale and position it right
    const x = getAttribute(this.element, 'x') || 0
    const y = getAttribute(this.element, 'y') || 0
    const width = getAttribute(this.element, 'width') || formObject.width
    const height = getAttribute(this.element, 'height') || formObject.height
    let t = new context.pdf.Matrix(
      width / formObject.width || 0,
      0,
      0,
      height / formObject.height || 0,
      x,
      y
    )
    t = context.pdf.matrixMult(t, context.transform)
    context.pdf.doFormObject(id, t)
  }

  protected getBoundingBoxCore(context: Context): Rect {
    return addLineWidth(defaultBoundingBox(this.element), this.element)
  }

  isVisible(parentVisible: boolean): boolean {
    return svgNodeIsVisible(this, parentVisible)
  }

  protected computeNodeTransformCore(context: Context): any {
    return context.pdf.unitMatrix
  }
}
