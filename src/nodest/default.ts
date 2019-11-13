import NodeStructureTree from './nst'
import { defaultBoundingBox } from '../utils/bbox'
import Context from '../context/context'

export default class DefaultNST extends NodeStructureTree {
  renderCore(): void {}
  getBoundingBoxCore(context: Context): number[] {
    return defaultBoundingBox(this.element, context)
  }
  computeNodeTransformCore(context: Context): any {
    return context._pdf.unitMatrix
  }
}
