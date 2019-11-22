import { SvgNode } from './svgnode'
import { Context } from '../context/context'

export abstract class NonRenderedNode extends SvgNode {
  render(): void {}
  protected getBoundingBoxCore(context: Context): number[] {
    return []
  }
  protected computeNodeTransformCore(context: Context): any {
    return context._pdf.unitMatrix
  }
  abstract apply(context: Context): void
}
