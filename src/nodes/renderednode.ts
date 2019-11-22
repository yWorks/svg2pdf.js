import { SvgNode } from './svgnode'
import { Context } from '../context/context'
import { parseAttributes, applyAttributes } from '../applyparseattributes'
import { getAttribute } from '../utils/node'
import { iriReference } from '../utils/constants'
import { ClipPath } from './clippath'

export abstract class RenderedNode extends SvgNode {
  render(parentContext: Context) {
    if (!this.isVisible(parentContext.attributeState.visibility !== 'hidden', parentContext)) {
      return
    }

    let context = parseAttributes(parentContext.clone(), this)

    const clipNode = this.getClipPathNode(context)
    if (clipNode === undefined) {
      return
    }
    if (clipNode) {
      context._pdf.saveGraphicsState()
      this.clip(context, clipNode)
    }

    if (!context.withinClipPath) {
      context._pdf.saveGraphicsState()
    }
    applyAttributes(context, parentContext, this.element)

    this.renderCore(context)

    if (!context.withinClipPath) {
      context._pdf.restoreGraphicsState()
    }

    if (clipNode) {
      context._pdf.restoreGraphicsState()
    }
  }
  protected abstract renderCore(context: Context): void

  protected clip(outerContext: Context, clipPathNode: ClipPath) {
    const clipContext = outerContext.clone()
    if (
      clipPathNode.element.hasAttribute('clipPathUnits') &&
      clipPathNode.element.getAttribute('clipPathUnits').toLowerCase() === 'objectboundingbox'
    ) {
      const bBox = this.getBBox(outerContext)
      clipContext.transform = outerContext._pdf.matrixMult(
        new outerContext._pdf.Matrix(bBox[2], 0, 0, bBox[3], bBox[0], bBox[1]),
        outerContext.transform
      )
    }
    clipPathNode.apply(clipContext)
  }

  protected getClipPathNode(context: Context) {
    if (
      this.element.hasAttribute('clip-path') &&
      getAttribute(this.element, 'clip-path', context.styleSheets) !== 'none'
    ) {
      const clipPathId = iriReference.exec(getAttribute(this.element, 'clip-path', context.styleSheets))[1]
      const clipNode = context.refsHandler.get(clipPathId)
      return clipNode && clipNode instanceof ClipPath && clipNode.isVisible(true, context)
        ? clipNode
        : undefined
    } else {
      return null
    }
  }
}
