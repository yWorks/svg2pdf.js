import { Context } from '../context/context'
import { addLineWidth, defaultBoundingBox } from '../utils/bbox'
import { getAttribute, svgNodeIsVisible } from '../utils/node'
import { GraphicsNode } from './graphicsnode'

// draws the element referenced by a use node, makes use of pdf's XObjects/FormObjects so nodes are only written once
// to the pdf document. This highly reduces the file size and computation time.
export class Use extends GraphicsNode {
  protected renderCore(context: Context) {
    const url = this.element.getAttribute('href') || this.element.getAttribute('xlink:href')
    // just in case someone has the idea to use empty use-tags, wtf???
    if (!url) return

    // get the size of the referenced form object (to apply the correct scaling)
    const id = url.substring(1)
    context.refsHandler.getRendered(id, context)
    const formObject = context._pdf.getFormObject(id)

    // scale and position it right
    const x = getAttribute(this.element, 'x', context.styleSheets) || 0
    const y = getAttribute(this.element, 'y', context.styleSheets) || 0
    const width = getAttribute(this.element, 'width', context.styleSheets) || formObject.width
    const height = getAttribute(this.element, 'height', context.styleSheets) || formObject.height
    let t = new context._pdf.Matrix(
      width / formObject.width || 0,
      0,
      0,
      height / formObject.height || 0,
      x,
      y
    )
    t = context._pdf.matrixMult(t, context.transform)
    context._pdf.doFormObject(id, t)
  }

  protected getBoundingBoxCore(context: Context): number[] {
    return addLineWidth(defaultBoundingBox(this.element, context), this.element, context)
  }

  isVisible(parentVisible: boolean, context:Context): boolean {
    return svgNodeIsVisible(this, parentVisible, context)
  }

  protected computeNodeTransformCore(context: Context): any {
    return context._pdf.unitMatrix
  }
}
