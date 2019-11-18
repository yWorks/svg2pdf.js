import { Context } from '../context/context'
import { getBoundingBoxByChildren } from '../utils/bbox'
import { Groups } from './groups'
import { svgNodeAndChildrenVisible } from '../utils/node'

export class Group extends Groups {
  getBoundingBoxCore(context: Context): number[] {
    return getBoundingBoxByChildren(context, this)
  }

  isVisible(parentVisible: boolean): boolean {
    return svgNodeAndChildrenVisible(this, parentVisible)
  }
}
