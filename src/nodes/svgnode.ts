import { applyAttributes, parseAttributes } from '../applyparseattributes'
import { Context } from '../context/context'
import { getAttribute, nodeIs } from '../utils/node'
import { parseTransform } from '../utils/transform'
import { iriReference } from '../utils/constants'

export abstract class SvgNode {
  element: HTMLElement
  parent: SvgNode
  children: SvgNode[]

  constructor(element: HTMLElement, children: SvgNode[]) {
    this.element = element
    this.children = children
    this.parent = null
  }

  protected abstract getBoundingBoxCore(context: Context): number[]
  getBBox(context: Context): number[] {
    if (getAttribute(this.element, 'display') === 'none') {
      return [0, 0, 0, 0]
    }
    return this.getBoundingBoxCore(context)
  }

  protected abstract computeNodeTransformCore(context: Context): any
  computeNodeTransform(context: Context): any {
    const nodeTransform = this.computeNodeTransformCore(context)
    const transformString = getAttribute(this.element, 'transform')
    if (!transformString) return nodeTransform
    else return context._pdf.matrixMult(nodeTransform, parseTransform(transformString, context))
  }

  protected abstract renderCore(context: Context): void
  render(parentContext: Context) {
    if (!this.isVisible(parentContext.attributeState.visibility === 'hidden')) {
      return
    }

    let context = parseAttributes(parentContext.clone(), this)

    const clipPath = this.hasClipPath(context)
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

  clip(outerContext: Context, clipPath: string) {
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

  hasClipPath(context: Context) {
    if (
      this.element.hasAttribute('clip-path') &&
      getAttribute(this.element, 'clip-path') !== 'none'
    ) {
      const clipPathId = iriReference.exec(getAttribute(this.element, 'clip-path'))[1]
      const clipNode = context.refsHandler.get(clipPathId)
      return clipNode && clipNode.isVisible() ? clipPathId : null
    } else {
      return false
    }
  }

  isVisible(parentHidden?: boolean) {
    if (getAttribute(this.element, 'display') === 'none') {
      return false
    }

    let visible = !parentHidden

    const visibility = getAttribute(this.element, 'visibility')
    if (visibility) {
      visible = visibility !== 'hidden'
    }

    const res = this.visibleCore(visible)
    visible = res === null ? false : res || visible

    return visible
  }
  childrenVisible(visible: boolean) {
    if (this.element.childNodes.length === 0) {
      return null
    }
    this.children.forEach(child => {
      if (child.isVisible(!visible)) {
        visible = true
      }
    })
    return visible
  }

  abstract visibleCore(visible: boolean): boolean

  protected fillOrStroke(childContext: Context) {
    if (!childContext.withinClipPath) {
      const fill = childContext.attributeState.fill
      // pdf spec states: "A line width of 0 denotes the thinnest line that can be rendered at device resolution:
      // 1 device pixel wide". SVG, however, does not draw zero width lines.
      const stroke =
        childContext.attributeState.stroke && childContext.attributeState.strokeWidth !== 0

      const patternOrGradient = fill && fill.key ? fill : undefined
      const isNodeFillRuleEvenOdd = getAttribute(this.element, 'fill-rule') === 'evenodd'
      if (fill && stroke) {
        if (isNodeFillRuleEvenOdd) {
          childContext._pdf.fillStrokeEvenOdd(patternOrGradient)
        } else {
          childContext._pdf.fillStroke(patternOrGradient)
        }
      } else if (fill) {
        if (isNodeFillRuleEvenOdd) {
          childContext._pdf.fillEvenOdd(patternOrGradient)
        } else {
          childContext._pdf.fill(patternOrGradient)
        }
      } else if (stroke) {
        childContext._pdf.stroke()
      } else {
        childContext._pdf.discardPath()
      }
    }
  }
}
