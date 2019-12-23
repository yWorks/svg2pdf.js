import { SvgNode } from './svgnode'
import { Context } from '../context/context'
import { svgNodeIsVisible } from '../utils/node'
import { Rect } from '../utils/geometry'
import { Matrix } from 'jspdf-yworks'

export class VoidNode extends SvgNode {
  render(parentContext: Context): Promise<void> {
    return Promise.resolve()
  }
  protected getBoundingBoxCore(context: Context): Rect {
    return [0, 0, 0, 0]
  }
  protected computeNodeTransformCore(context: Context): Matrix {
    return context.pdf.unitMatrix
  }
  isVisible(parentVisible: boolean): boolean {
    return svgNodeIsVisible(this, parentVisible)
  }
}
