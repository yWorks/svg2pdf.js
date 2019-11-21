import { SvgNode } from './svgnode'
import { Context } from '../context/context'

export abstract class NonRenderedNode extends SvgNode {
  renderCore(): void {}
  render(): void {}
  getBoundingBoxCore(context: Context): number[] {
    return []
  }
  computeNodeTransformCore(context: Context): any {
    return context._pdf.unitMatrix
  }
  abstract apply(context: Context): void
}
