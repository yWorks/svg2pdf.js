import { getAttribute, svgNodeAndChildrenVisible } from '../utils/node'
import { Context } from '../context/context'
import { addLineWidth, getBoundingBoxByChildren } from '../utils/bbox'
import { parseFloats } from '../utils/parsing'
import { computeViewBoxTransform } from '../utils/transform'
import { NonRenderedNode } from './nonrenderednode'
import { applyAttributes, parseAttributes } from '../applyparseattributes'
import { applyClipPath, getClipPathNode } from '../utils/applyclippath'

export class Symbol extends NonRenderedNode {
  async apply(context: Context): Promise<void> {
    const bBox = this.getBoundingBox(context)
    context.pdf.beginFormObject(bBox[0], bBox[1], bBox[2], bBox[3], context.pdf.unitMatrix)
    await this.renderChildren(context)
    context.pdf.endFormObject(this.element.getAttribute('id'))
  }

  private async renderChildren(parentContext: Context): Promise<void> {
    if (!this.isVisible(parentContext.attributeState.visibility !== 'hidden')) {
      return
    }

    const context = parentContext.clone()
    context.transform = context.pdf.unitMatrix

    parseAttributes(context, this)

    const hasClipPath =
      this.element.hasAttribute('clip-path') && getAttribute(this.element, 'clip-path') !== 'none'

    if (hasClipPath) {
      const clipNode = getClipPathNode(this, context)
      if (clipNode && clipNode.isVisible(true)) {
        await applyClipPath(this, clipNode, context)
      } else {
        return
      }
    }

    applyAttributes(context, parentContext, this.element)
    for (const child of this.children) {
      await child.render(context)
    }
  }

  getBoundingBoxCore(context: Context): number[] {
    return addLineWidth(getBoundingBoxByChildren(context, this), this)
  }
  isVisible(parentVisible: boolean): boolean {
    return svgNodeAndChildrenVisible(this, parentVisible)
  }
  computeNodeTransformCore(context: Context) {
    const x = parseFloat(getAttribute(this.element, 'x') || '0')
    const y = parseFloat(getAttribute(this.element, 'y') || '0')
    // TODO: implement refX/refY - this is still to do because common browsers don't seem to support the feature yet
    // x += parseFloat(this.element.getAttribute("refX")) || 0; ???
    // y += parseFloat(this.element.getAttribute("refY")) || 0; ???

    const viewBox = this.element.getAttribute('viewBox')
    if (viewBox) {
      const box = parseFloats(viewBox)
      const width = parseFloat(
        getAttribute(this.element, 'width') ||
          getAttribute((this.element as any).ownerSVGElement, 'width') ||
          viewBox[2]
      )
      const height = parseFloat(
        getAttribute(this.element, 'height') ||
          getAttribute((this.element as any).ownerSVGElement, 'height') ||
          viewBox[3]
      )
      return computeViewBoxTransform(this.element, box, x, y, width, height, context)
    } else {
      return context.pdf.Matrix(1, 0, 0, 1, x, y)
    }
  }
}
