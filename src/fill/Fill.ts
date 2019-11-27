import { Context } from '../context/context'
import { GraphicsNode } from '../nodes/graphicsnode'

export interface Fill {
  getFillData(forNode: GraphicsNode, context: Context): object | undefined
}
