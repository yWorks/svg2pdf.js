import { SvgNode } from './svgnode'
import { Context } from '../context/context'

export class VoidNode extends SvgNode {
  renderCore(): void {}
  getBoundingBoxCore(context: Context): number[] {
    return [0,0,0,0]
  }
  computeNodeTransformCore(context: Context): any {
    return context._pdf.unitMatrix
  }
}
