import { SvgNode } from './svgnode'
import { getAttribute } from '../utils/node'
import { Context } from '../context/context'
import { EllipseBase } from './ellipsebase'

export class Circle extends EllipseBase {
  private r: number | undefined

  private getR(context: Context) {
    return (
      this.r ?? (this.r = parseFloat(getAttribute(this.element, context.styleSheets, 'r') || '0'))
    )
  }

  getRx(context: Context): number {
    return this.getR(context)
  }
  getRy(context: Context): number {
    return this.getR(context)
  }

  constructor(node: Element, children: SvgNode[]) {
    super(node, children)
  }
}
