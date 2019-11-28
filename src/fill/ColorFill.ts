import { Fill, FillData } from './Fill'
import { RGBColor } from '../utils/rgbcolor'
import { Context } from '../context/context'
import { GraphicsNode } from '../nodes/graphicsnode'

export class ColorFill implements Fill {
  public readonly color: RGBColor

  constructor(color: RGBColor) {
    this.color = color
  }

  async getFillData(forNode: GraphicsNode, context: Context): Promise<FillData | undefined> {
    return undefined
  }
}
