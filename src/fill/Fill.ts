import { Context } from '../context/context'
import { GraphicsNode } from '../nodes/graphicsnode'
import { Matrix } from 'jspdf'

export interface Fill {
  getFillData(forNode: GraphicsNode, context: Context): Promise<FillData | undefined>
}

export interface FillData {
  key: string
  matrix?: Matrix
  boundingBox?: number[]
  xStep?: number
  yStep?: number
}
