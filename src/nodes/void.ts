import { SvgNode } from './svgnode'
import { Context } from '../context/context'
import { svgNodeIsVisible } from '../utils/node'

export class VoidNode extends SvgNode {
  render(): void {}
  renderCore(): void {}
  getBoundingBoxCore(context: Context): number[] {
    return [0, 0, 0, 0]
  }
  computeNodeTransformCore(context: Context): any {
    return context._pdf.unitMatrix
  }
  isVisible(parentVisible: boolean): boolean {
    return svgNodeIsVisible(this, parentVisible)
  }
}
