import { SvgNode } from './svgnode'
import { Context } from '../context/context'
import { parseAttributes, applyAttributes } from '../applyparseattributes'
import { getAttribute } from '../utils/node'
import { iriReference } from '../utils/constants'

export abstract class RenderedNode extends SvgNode {
  render(parentContext: Context) {
    if (!this.isVisible(parentContext.attributeState.visibility !== 'hidden')) {
      return
    }

    let context = parseAttributes(parentContext.clone(), this)

    const clipPath = this.getClipPath(context)
    if (clipPath !== null) {
      if (clipPath) {
        context._pdf.saveGraphicsState()
        this.clip(context, clipPath)
      }
    } else {
      return
    }
    if (!context.withinClipPath) {
      context._pdf.saveGraphicsState()
    }
    applyAttributes(context, parentContext, this.element)

    this.renderCore(context)

    if (!context.withinClipPath) {
      context._pdf.restoreGraphicsState()
    }

    if (clipPath) {
      context._pdf.restoreGraphicsState()
    }
  }
  protected abstract renderCore(context: Context): void

  protected clip(outerContext: Context, clipPath: string) {
    const clipPathNode = outerContext.refsHandler.get(clipPath)
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
    outerContext.refsHandler.getRendered(clipPath, clipContext)
  }

  protected getClipPath(context: Context) {
    if (
      this.element.hasAttribute('clip-path') &&
      getAttribute(this.element, 'clip-path') !== 'none'
    ) {
      const clipPathId = iriReference.exec(getAttribute(this.element, 'clip-path'))[1]
      const clipNode = context.refsHandler.get(clipPathId)
      return clipNode && clipNode.isVisible(true) ? clipPathId : null
    } else {
      return undefined
    }
  }
}
