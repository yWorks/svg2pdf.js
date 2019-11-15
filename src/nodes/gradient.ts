import { Context } from '../context/context'
import { defaultBoundingBox } from '../utils/bbox'
import { PassiveNode } from './passivenode'
import { nodeIs } from '../utils/node'
import { putGradient } from '../utils/patterngradient'

export abstract class Gradient extends PassiveNode {
  abstract renderPassive(context: Context):void
  getBoundingBoxCore(context: Context): number[] {
    return defaultBoundingBox(this.element, context)
  }
  computeNodeTransformCore(context: Context): any {
    return context._pdf.unitMatrix
  }
}
