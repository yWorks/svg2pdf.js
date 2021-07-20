import { getAttribute, svgNodeAndChildrenVisible } from '../utils/node'
import { Context } from '../context/context'
import { getBoundingBoxByChildren } from '../utils/bbox'
import { parseFloats } from '../utils/parsing'
import { computeViewBoxTransform } from '../utils/transform'
import { NonRenderedNode } from './nonrenderednode'
import { applyAttributes, parseAttributes } from '../applyparseattributes'
import { applyClipPath, getClipPathNode } from '../utils/applyclippath'
import { Matrix } from 'jspdf'

export class Symbol extends NonRenderedNode {
  async apply(parentContext: Context): Promise<void> {
    if (!this.isVisible(parentContext.attributeState.visibility !== 'hidden', parentContext)) {
      return
    }

    const context = parentContext.clone()
    context.transform = context.pdf.unitMatrix

    parseAttributes(context, this)

    const clipPathAttribute = getAttribute(this.element, context.styleSheets, 'clip-path')
    const hasClipPath = clipPathAttribute && clipPathAttribute !== 'none'

    if (hasClipPath) {
      const clipNode = getClipPathNode(clipPathAttribute!, this, context)
      if (clipNode) {
        if (clipNode.isVisible(true, context)) {
          await applyClipPath(this, clipNode, context)
        } else {
          return
        }
      }
    }

    applyAttributes(context, parentContext, this.element)
    for (const child of this.children) {
      await child.render(context)
    }
  }

  getBoundingBoxCore(context: Context): number[] {
    return getBoundingBoxByChildren(context, this)
  }
  isVisible(parentVisible: boolean, context: Context): boolean {
    return svgNodeAndChildrenVisible(this, parentVisible, context)
  }
  computeNodeTransformCore(context: Context): Matrix {
    const x = parseFloat(getAttribute(this.element, context.styleSheets, 'x') || '0')
    const y = parseFloat(getAttribute(this.element, context.styleSheets, 'y') || '0')
    // TODO: implement refX/refY - this is still to do because common browsers don't seem to support the feature yet
    // x += parseFloat(this.element.getAttribute("refX")) || 0; ???
    // y += parseFloat(this.element.getAttribute("refY")) || 0; ???

    const viewBox = this.element.getAttribute('viewBox')
    if (viewBox) {
      const box = parseFloats(viewBox)
      const width = parseFloat(
        getAttribute(this.element, context.styleSheets, 'width') ||
          getAttribute(
            (this.element as SVGElement).ownerSVGElement!,
            context.styleSheets,
            'width'
          ) ||
          viewBox[2]
      )
      const height = parseFloat(
        getAttribute(this.element, context.styleSheets, 'height') ||
          getAttribute(
            (this.element as SVGElement).ownerSVGElement!,
            context.styleSheets,
            'height'
          ) ||
          viewBox[3]
      )
      return computeViewBoxTransform(this.element, box, x, y, width, height, context)
    } else {
      return context.pdf.Matrix(1, 0, 0, 1, x, y)
    }
  }
}
