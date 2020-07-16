import { applyAttributes, parseAttributes } from '../applyparseattributes'
import { Context } from '../context/context'
import { getAttribute } from '../utils/node'
import { SvgNode } from './svgnode'
import { applyClipPath, getClipPathNode } from '../utils/applyclippath'

export abstract class RenderedNode extends SvgNode {
  async render(parentContext: Context): Promise<void> {
    if (!this.isVisible(parentContext.attributeState.visibility !== 'hidden')) {
      return
    }

    const context = parentContext.clone()
    context.transform = context.pdf.matrixMult(
      this.computeNodeTransform(context),
      parentContext.transform
    )

    parseAttributes(context, this)

    const hasClipPath =
      this.element.hasAttribute('clip-path') && getAttribute(this.element, 'clip-path') !== 'none'

    if (hasClipPath) {
      const clipNode = getClipPathNode(this, context)
      if (clipNode && clipNode.isVisible(true)) {
        context.pdf.saveGraphicsState()
        await applyClipPath(this, clipNode, context)
      } else {
        return
      }
    }

    if (!context.withinClipPath) {
      context.pdf.saveGraphicsState()
    }
    applyAttributes(context, parentContext, this.element)
    await this.renderCore(context)
    if (!context.withinClipPath) {
      context.pdf.restoreGraphicsState()
    }

    if (hasClipPath) {
      context.pdf.restoreGraphicsState()
    }
  }

  protected abstract async renderCore(context: Context): Promise<void>
}
