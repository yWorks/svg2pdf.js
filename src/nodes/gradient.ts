import { Context } from '../context/context'
import { defaultBoundingBox } from '../utils/bbox'
import { NonRenderedNode } from './nonrenderednode'
import { svgNodeAndChildrenVisible } from '../utils/node'

export abstract class Gradient extends NonRenderedNode {
  abstract apply(context: Context): void
  getBoundingBoxCore(context: Context): number[] {
    return defaultBoundingBox(this.element, context)
  }
  computeNodeTransformCore(context: Context): any {
    return context._pdf.unitMatrix
  }
  isVisible(parentVisible: boolean): boolean {
    return svgNodeAndChildrenVisible(this, parentVisible)
  }
}
