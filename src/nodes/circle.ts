import { SvgNode } from './svgnode'
import { Ellipse } from './ellipse'
import { getAttribute } from '../utils/node'
import { Context } from '../context/context'

export class Circle extends Ellipse {
  constructor(node: HTMLElement, children: SvgNode[], context:Context) {
    super(node, children, context)
    this.rx = this.ry = parseFloat(getAttribute(this.element, 'r', context.styleSheets))
  }
}
