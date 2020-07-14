import { getAttribute } from '../utils/node'
import { EllipseBase } from './ellipsebase'
import { SvgNode } from './svgnode'

export class Ellipse extends EllipseBase {
  constructor(element: HTMLElement, children: SvgNode[]) {
    super(element, children)
  }

  get rx(): number {
    return parseFloat(getAttribute(this.element, 'rx') || '0')
  }
  get ry(): number {
    return parseFloat(getAttribute(this.element, 'ry') || '0')
  }
}
