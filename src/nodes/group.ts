import { Context } from '../context/context'
import { getBoundingBoxByChildren } from '../utils/bbox'
import { ContainerNode } from './containernode'
import { svgNodeAndChildrenVisible } from '../utils/node'
import { Rect } from '../utils/geometry'

export class Group extends ContainerNode {
  protected getBoundingBoxCore(context: Context): Rect {
    return getBoundingBoxByChildren(context, this)
  }

  isVisible(parentVisible: boolean): boolean {
    return svgNodeAndChildrenVisible(this, parentVisible)
  }

  protected computeNodeTransformCore(context: Context): any {
    return context.pdf.unitMatrix
  }
}
