import { SvgNode } from './svgnode'
import { Context } from '../context/context'
import { svgNodeIsVisible } from '../utils/node'

export class VoidNode extends SvgNode {
  render(): void {}
  protected getBoundingBoxCore(context: Context): number[] {
    return [0, 0, 0, 0]
  }
  protected computeNodeTransformCore(context: Context): any {
    return context._pdf.unitMatrix
  }
  isVisible(parentVisible: boolean, context:Context): boolean {
    return svgNodeIsVisible(this, parentVisible, context)
  }
}
