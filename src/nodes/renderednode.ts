import { applyAttributes, parseAttributes } from '../applyparseattributes'
import { Context } from '../context/context'
import { iriReference } from '../utils/constants'
import { getAttribute, nodeIs } from '../utils/node'
import { ClipPath } from './clippath'
import { SvgNode } from './svgnode'

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
      const clipNode = this.getClipPathNode(context)
      if (clipNode && clipNode.isVisible(true)) {
        context.pdf.saveGraphicsState()
        await this.clip(context, clipNode)
      } else {
        return
      }
    }

    // TODO:
    if (!context.withinClipPath && !nodeIs(this.element, 'symbol')) {
      context.pdf.saveGraphicsState()
    }
    applyAttributes(context, parentContext, this.element)
    await this.renderCore(context)
    if (!context.withinClipPath && !nodeIs(this.element, 'symbol')) {
      context.pdf.restoreGraphicsState()
    }

    if (hasClipPath) {
      context.pdf.restoreGraphicsState()
    }
  }

  protected abstract async renderCore(context: Context): Promise<void>

  private getClipPathNode(context: Context): ClipPath | undefined {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    const clipPathId = iriReference.exec(getAttribute(this.element, 'clip-path'))[1]
    const clipNode = context.refsHandler.get(clipPathId)
    return (clipNode as ClipPath) || undefined
  }

  private async clip(outerContext: Context, clipPathNode: ClipPath): Promise<void> {
    const clipContext = outerContext.clone()
    if (
      clipPathNode.element.hasAttribute('clipPathUnits') &&
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      clipPathNode.element.getAttribute('clipPathUnits').toLowerCase() === 'objectboundingbox'
    ) {
      const bBox = this.getBoundingBox(outerContext)
      clipContext.transform = outerContext.pdf.matrixMult(
        outerContext.pdf.Matrix(bBox[2], 0, 0, bBox[3], bBox[0], bBox[1]),
        outerContext.transform
      )
    }
    await clipPathNode.apply(clipContext)
  }
}
