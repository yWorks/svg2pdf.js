import { Context } from '../context/context'
import { defaultBoundingBox } from '../utils/bbox'
import { PassiveNode } from './passivenode'

export class Pattern extends PassiveNode {
  renderPassive(context: Context): void {
    const id = this.element.getAttribute('id')

    // the transformations directly at the node are written to the pattern transformation matrix
    const bBox = this.getBBox(context)
    const pattern = new context._pdf.TilingPattern(
      [bBox[0], bBox[1], bBox[0] + bBox[2], bBox[1] + bBox[3]],
      bBox[2],
      bBox[3],
      null,
      context._pdf.unitMatrix /* Utils parameter is ignored !*/
    )

    context._pdf.beginTilingPattern(pattern)
    // continue without transformation

    this.children.forEach(child =>
      child.render(
        new Context(context._pdf, {
          attributeState: context.attributeState,
          refsHandler: context.refsHandler,
          transform: child.computeNodeTransform(context)
        })
      )
    )
    context._pdf.endTilingPattern(id, pattern)
  }
  getBoundingBoxCore(context: Context): number[] {
    return defaultBoundingBox(this.element, context)
  }
  computeNodeTransformCore(context: Context): any {
    return context._pdf.unitMatrix
  }
  visibleCore(visible: boolean) {
    return this.childrenVisible(visible)
  }
}
