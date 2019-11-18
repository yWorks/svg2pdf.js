import { Context } from '../context/context'
import { getBoundingBoxByChildren } from '../utils/bbox'
import { Groups } from './groups'

export class Group extends Groups {
  getBoundingBoxCore(context: Context): number[] {
    return getBoundingBoxByChildren(context, this)
  }

  visibleCore(visible: boolean) {
    return this.childrenVisible(visible)
  }
}
