import { Context } from '../context/context'
import { defaultBoundingBox } from '../utils/bbox'
import { NonRenderedNode } from './nonrenderednode'
import { svgNodeAndChildrenVisible } from '../utils/node'

export abstract class Gradient extends NonRenderedNode {
  protected getBoundingBoxCore(context: Context): number[] {
    return defaultBoundingBox(this.element, context)
  }
  protected computeNodeTransformCore(context: Context): any {
    return context._pdf.unitMatrix
  }
  isVisible(parentVisible: boolean, context:Context): boolean {
    return svgNodeAndChildrenVisible(this, parentVisible, context)
  }
}
