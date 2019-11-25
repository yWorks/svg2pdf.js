import { Context } from '../context/context'
import { addLineWidth, defaultBoundingBox } from '../utils/bbox'
import { getAttribute, svgNodeIsVisible, nodeIs } from '../utils/node'
import { GraphicsNode } from './graphicsnode'
import { computeViewBoxTransform } from '../utils/transform'
import { parseFloats } from '../utils/math'

// draws the element referenced by a use node, makes use of pdf's XObjects/FormObjects so nodes are only written once
// to the pdf document. This highly reduces the file size and computation time.
export class Use extends GraphicsNode {
  protected renderCore(context: Context) {
    const pf = parseFloat
    let x, y, width, height, t

    const url = this.element.getAttribute('href') || this.element.getAttribute('xlink:href')
    // just in case someone has the idea to use empty use-tags, wtf???
    if (!url) return

    // get the size of the referenced form object (to apply the correct scaling)
    const id = url.substring(1),
      refNode = context.refsHandler.getRendered(id, context),
      formObject = context._pdf.getFormObject(id),
      refNodeOpensViewport = nodeIs(refNode.element, 'symbol,svg')

    // scale and position it right
    x = pf(getAttribute(this.element, 'x')) || 0
    y = pf(getAttribute(this.element, 'y')) || 0

    //  calculate the transformation matrix
    if (refNodeOpensViewport) {
      //  <use> inherits width/height only to svg/symbol
      width = pf(
        getAttribute(this.element, 'width') ||
          getAttribute(refNode.element, 'width') ||
          formObject.width
      )
      height = pf(
        getAttribute(this.element, 'height') ||
          getAttribute(refNode.element, 'height') ||
          formObject.height
      )

      const hasViewBox = refNode.element.getAttribute('viewBox')
      if (hasViewBox) {
        //  inherit width/height from the parent svg if necessary
        width = width || pf(getAttribute((this.element as any).ownerSVGElement, 'width'))
        height = height || pf(getAttribute((this.element as any).ownerSVGElement, 'height'))
        //  accumulate x/y to calculate the viewBox transform
        x += pf(getAttribute(refNode.element, 'x')) || 0
        y += pf(getAttribute(refNode.element, 'y')) || 0

        t = computeViewBoxTransform(
          refNode.element,
          parseFloats(refNode.element.getAttribute('viewBox')),
          x,
          y,
          width,
          height,
          context
        )
      } else {
        t = new context._pdf.Matrix(
          (width || formObject.width) / formObject.width || 0,
          0,
          0,
          (height || formObject.height) / formObject.height || 0,
          x,
          y
        )
      }
    } else {
      t = new context._pdf.Matrix(1, 0, 0, 1, x, y)
    }

    context._pdf.saveGraphicsState()
    context._pdf.setCurrentTransformationMatrix(context.transform)

    //  apply the bbox (i.e. clip) if needed
    if (refNodeOpensViewport && getAttribute(refNode.element, 'overflow') !== 'visible') {
      context._pdf.rect(x, y, width, height)
      context._pdf.clip().discardPath()
    }

    context._pdf.doFormObject(id, t)
    context._pdf.restoreGraphicsState()
  }

  protected getBoundingBoxCore(context: Context): number[] {
    return addLineWidth(defaultBoundingBox(this.element, context), this)
  }

  isVisible(parentVisible: boolean): boolean {
    return svgNodeIsVisible(this, parentVisible)
  }

  protected computeNodeTransformCore(context: Context): any {
    return context._pdf.unitMatrix
  }
}
