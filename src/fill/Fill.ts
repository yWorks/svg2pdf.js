import { Context } from '../context/context'
import { GraphicsNode } from '../nodes/graphicsnode'

export interface Fill {
  getFillData(forNode: GraphicsNode, context: Context): FillData | undefined
}

export interface FillData {
  key: string
  matrix?: any
  boundingBox?: number[]
  xStep?: number
  yStep?: number
}
