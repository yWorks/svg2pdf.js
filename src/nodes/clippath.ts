import { Context } from '../context/context'
import { NonRenderedNode } from './nonrenderednode'
import { getBoundingBoxByChildren } from '../utils/bbox'
import { svgNodeAndChildrenVisible } from '../utils/node'
import { Rect } from '../utils/geometry'

export class ClipPath extends NonRenderedNode {
  async apply(context: Context): Promise<void> {
    if (!this.isVisible(true, context)) {
      return
    }

    // here, browsers show different results for a "transform" attribute on the clipPath element itself:
    // IE/Edge considers it, Chrome and Firefox ignore it. However, the specification lists "transform" as a valid
    // attribute for clipPath elements, although not explicitly explaining its behavior. This implementation follows
    // IE/Edge and considers the "transform" attribute as additional transformation within the coordinate system
    // established by the "clipPathUnits" attribute.
    const clipPathMatrix = context.pdf.matrixMult(
      this.computeNodeTransform(context),
      context.transform
    )

    context.pdf.setCurrentTransformationMatrix(clipPathMatrix)

    for (const child of this.children) {
      await child.render(
        new Context(context.pdf, {
          refsHandler: context.refsHandler,
          styleSheets: context.styleSheets,
          viewport: context.viewport,
          withinClipPath: true,
          svg2pdfParameters: context.svg2pdfParameters
        })
      )
    }
    context.pdf.clip().discardPath()

    // as we cannot use restoreGraphicsState() to reset the transform (this would reset the clipping path, as well),
    // we must append the inverse instead
    context.pdf.setCurrentTransformationMatrix(clipPathMatrix.inversed())
  }

  protected getBoundingBoxCore(context: Context): Rect {
    return getBoundingBoxByChildren(context, this)
  }

  isVisible(parentVisible: boolean, context: Context): boolean {
    return svgNodeAndChildrenVisible(this, parentVisible, context)
  }
}
