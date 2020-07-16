import { getAttribute } from '../utils/node'
import { EllipseBase } from './ellipsebase'
import { SvgNode } from './svgnode'
import { Context } from '../context/context'

export class Ellipse extends EllipseBase {
  constructor(element: HTMLElement, children: SvgNode[]) {
    super(element, children)
  }

  getRx(context: Context): number {
    return parseFloat(getAttribute(this.element, context.styleSheets, 'rx') || '0')
  }
  getRy(context: Context): number {
    return parseFloat(getAttribute(this.element, context.styleSheets, 'ry') || '0')
  }
}
