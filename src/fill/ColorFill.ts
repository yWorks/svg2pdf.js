import { Fill } from './Fill'
import { RGBColor } from '../utils/rgbcolor'
import { SvgNode } from '../nodes/svgnode'
import { Context } from '../context/context'
import { GraphicsNode } from '../nodes/graphicsnode'

export class ColorFill implements Fill {
  public readonly color: RGBColor

  constructor(color: RGBColor) {
    this.color = color
  }

  getFillData(forNode: GraphicsNode, context: Context): object | undefined {
    return undefined
  }
}
