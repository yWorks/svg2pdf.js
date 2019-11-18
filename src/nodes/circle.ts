import { SvgNode } from './svgnode'
import { Ellipse } from './ellipse'
import { getAttribute } from '../utils/node'

export class Circle extends Ellipse {
  constructor(node: HTMLElement, children: SvgNode[]) {
    super(node, children)
    this.rx = this.ry = parseFloat(getAttribute(this.element, 'r'))
  }

  visibleCore(visible: boolean) {
    return visible
  }
}
