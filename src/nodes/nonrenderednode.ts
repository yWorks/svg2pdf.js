import { SvgNode } from './svgnode'
import { Context } from '../context/context'
import { Rect } from '../utils/geometry'

export abstract class NonRenderedNode extends SvgNode {
  render(): void {}
  protected getBoundingBoxCore(context: Context): Rect {
    return []
  }
  protected computeNodeTransformCore(context: Context): any {
    return context.pdf.unitMatrix
  }
  abstract apply(context: Context): void
}
