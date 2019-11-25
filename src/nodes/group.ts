import { Context } from '../context/context'
import { getBoundingBoxByChildren } from '../utils/bbox'
import { ContainerNode } from './containernode'
import { svgNodeAndChildrenVisible } from '../utils/node'

export class Group extends ContainerNode {
  protected getBoundingBoxCore(context: Context): number[] {
    return getBoundingBoxByChildren(context, this)
  }

  isVisible(parentVisible: boolean): boolean {
    return svgNodeAndChildrenVisible(this, parentVisible)
  }
}
