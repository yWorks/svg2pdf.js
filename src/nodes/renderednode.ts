import { SvgNode } from './svgnode'
import { Context } from '../context/context'
import { parseAttributes, applyAttributes } from '../applyparseattributes'
import { getAttribute } from '../utils/node'
import { iriReference } from '../utils/constants'
import { ClipPath } from './clippath'

export abstract class RenderedNode extends SvgNode {
  render(parentContext: Context): void {
    if (!this.isVisible(parentContext.attributeState.visibility !== 'hidden')) {
      return
    }

    const context = parseAttributes(parentContext.clone(), this)

    const hasClipPath =
      this.element.hasAttribute('clip-path') && getAttribute(this.element, 'clip-path') !== 'none'

    if (hasClipPath) {
      const clipNode = this.getClipPathNode(context)
      if (clipNode && clipNode.isVisible(true)) {
        context.pdf.saveGraphicsState()
        this.clip(context, clipNode)
      } else {
        return
      }
    }

    if (!context.withinClipPath) {
      context.pdf.saveGraphicsState()
    }
    applyAttributes(context, parentContext, this.element)
    this.renderCore(context)
    if (!context.withinClipPath) {
      context.pdf.restoreGraphicsState()
    }

    if (hasClipPath) {
      context.pdf.restoreGraphicsState()
    }
  }

  protected abstract renderCore(context: Context): void

  private getClipPathNode(context: Context): ClipPath | undefined {
    const clipPathId = iriReference.exec(getAttribute(this.element, 'clip-path'))[1]
    const clipNode = context.refsHandler.get(clipPathId)
    return (clipNode as ClipPath) || undefined
  }

  private clip(outerContext: Context, clipPathNode: ClipPath): void {
    const clipContext = outerContext.clone()
    if (
      clipPathNode.element.hasAttribute('clipPathUnits') &&
      clipPathNode.element.getAttribute('clipPathUnits').toLowerCase() === 'objectboundingbox'
    ) {
      const bBox = this.getBBox(outerContext)
      clipContext.transform = outerContext.pdf.matrixMult(
        new outerContext.pdf.Matrix(bBox[2], 0, 0, bBox[3], bBox[0], bBox[1]),
        outerContext.transform
      )
    }
    clipPathNode.apply(clipContext)
  }
}
