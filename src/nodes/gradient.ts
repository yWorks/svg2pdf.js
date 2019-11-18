import { Context } from '../context/context'
import { defaultBoundingBox } from '../utils/bbox'
import { PassiveNode } from './passivenode'

export abstract class Gradient extends PassiveNode {
  abstract renderPassive(context: Context): void
  getBoundingBoxCore(context: Context): number[] {
    return defaultBoundingBox(this.element, context)
  }
  computeNodeTransformCore(context: Context): any {
    return context._pdf.unitMatrix
  }
  visibleCore(visible: boolean) {
    return this.childrenVisible(visible)
  }
}
