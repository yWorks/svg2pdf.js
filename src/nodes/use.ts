import { Context } from '../context/context'
import { addLineWidth, defaultBoundingBox } from '../utils/bbox'
import { getAttribute, svgNodeIsVisible, nodeIs } from '../utils/node'
import { GraphicsNode } from './graphicsnode'
import { Matrix } from 'jspdf'
import { computeViewBoxTransform } from '../utils/transform'
import { parseFloats } from '../utils/parsing'

/**
 * Draws the element referenced by a use node, makes use of pdf's XObjects/FormObjects so nodes are only written once
 * to the pdf document. This highly reduces the file size and computation time.
 */
export class Use extends GraphicsNode {
  protected async renderCore(context: Context): Promise<void> {
    const pf = parseFloat

    const url = this.element.getAttribute('href') || this.element.getAttribute('xlink:href')
    // just in case someone has the idea to use empty use-tags, wtf???
    if (!url) return

    // get the size of the referenced form object (to apply the correct scaling)
    const id = url.substring(1)
    const refNode = await context.refsHandler.getRendered(id, context)
    const formObject = context.pdf.getFormObject(id)
    const refNodeOpensViewport = nodeIs(refNode.element, 'symbol,svg')

    // scale and position it right
    let x = pf(getAttribute(this.element, 'x') || '0')
    let y = pf(getAttribute(this.element, 'y') || '0')

    //  calculate the transformation matrix
    let width: number | undefined = undefined
    let height: number | undefined = undefined
    let t: Matrix
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

      const hasViewBox = refNode.element.hasAttribute('viewBox')
      if (hasViewBox) {
        //  inherit width/height from the parent svg if necessary
        width = width || pf(getAttribute((this.element as any).ownerSVGElement, 'width') || '0')
        height = height || pf(getAttribute((this.element as any).ownerSVGElement, 'height') || '0')
        //  accumulate x/y to calculate the viewBox transform
        x += pf(getAttribute(refNode.element, 'x') || '0')
        y += pf(getAttribute(refNode.element, 'y') || '0')

        t = computeViewBoxTransform(
          refNode.element,
          parseFloats(refNode.element.getAttribute('viewBox')!),
          x,
          y,
          width,
          height,
          context
        )
      } else {
        t = context.pdf.Matrix(
          (width || formObject.width) / formObject.width || 0,
          0,
          0,
          (height || formObject.height) / formObject.height || 0,
          x,
          y
        )
      }
    } else {
      t = context.pdf.Matrix(1, 0, 0, 1, x, y)
    }

    context.pdf.saveGraphicsState()
    context.pdf.setCurrentTransformationMatrix(context.transform)

    //  apply the bbox (i.e. clip) if needed
    if (refNodeOpensViewport && getAttribute(refNode.element, 'overflow') !== 'visible') {
      context.pdf.rect(x, y, width!, height!)
      context.pdf.clip().discardPath()
    }

    context.pdf.doFormObject(id, t)
    context.pdf.restoreGraphicsState()
  }

  protected getBoundingBoxCore(context: Context): number[] {
    return addLineWidth(defaultBoundingBox(this.element), this)
  }

  isVisible(parentVisible: boolean): boolean {
    return svgNodeIsVisible(this, parentVisible)
  }

  protected computeNodeTransformCore(context: Context): Matrix {
    return context.pdf.unitMatrix
  }
}
