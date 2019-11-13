import Context from '../context/context'
import NodeStructureTree from './nst'
import { defaultBoundingBox, addLineWidth } from '../utils/bbox'
import { getAttribute } from '../utils/node'

// draws the element referenced by a use node, makes use of pdf's XObjects/FormObjects so nodes are only written once
// to the pdf document. This highly reduces the file size and computation time.
export default class Use extends NodeStructureTree {
  renderCore(context: Context) {
    var url = this.element.getAttribute('href') || this.element.getAttribute('xlink:href')
    // just in case someone has the idea to use empty use-tags, wtf???
    if (!url) return

    // get the size of the referenced form object (to apply the correct scaling)
    var id = url.substring(1)
    context.refsHandler.getRendered(id, context)
    var formObject = context._pdf.getFormObject(id)

    // scale and position it right
    var x = getAttribute(this.element, 'x') || 0
    var y = getAttribute(this.element, 'y') || 0
    var width = getAttribute(this.element, 'width') || formObject.width
    var height = getAttribute(this.element, 'height') || formObject.height
    var t = new context._pdf.Matrix(
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

  getBoundingBoxCore(context: Context): number[] {
    return addLineWidth(defaultBoundingBox(this.element, context), this.element)
  }

  computeNodeTransformCore(context: Context): any {
    return context._pdf.unitMatrix
  }
}
