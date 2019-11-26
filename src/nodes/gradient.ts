import { Context } from '../context/context'
import { defaultBoundingBox } from '../utils/bbox'
import { NonRenderedNode } from './nonrenderednode'
import { svgNodeAndChildrenVisible } from '../utils/node'
import { Rect } from '../utils/geometry'

export abstract class Gradient extends NonRenderedNode {
  protected getBoundingBoxCore(context: Context): Rect {
    return defaultBoundingBox(this.element)
  }
  protected computeNodeTransformCore(context: Context): any {
    return context.pdf.unitMatrix
  }
  isVisible(parentVisible: boolean): boolean {
    return svgNodeAndChildrenVisible(this, parentVisible)
  }
}
