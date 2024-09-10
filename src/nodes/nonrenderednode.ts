import { SvgNode } from './svgnode'
import { Context } from '../context/context'
import { Rect } from '../utils/geometry'
import { Matrix } from 'jspdf'

export abstract class NonRenderedNode extends SvgNode {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  render(parentContext: Context): Promise<void> {
    return Promise.resolve()
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected getBoundingBoxCore(context: Context): Rect {
    return []
  }
  protected computeNodeTransformCore(context: Context): Matrix {
    return context.pdf.unitMatrix
  }
  abstract apply(context: Context): Promise<void>
}
