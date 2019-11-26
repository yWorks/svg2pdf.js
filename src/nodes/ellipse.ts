import { getAttribute } from '../utils/node'
import { EllipseBase } from './EllipseBase'
import { SvgNode } from './svgnode'

export class Ellipse extends EllipseBase {
  constructor(element: HTMLElement, children: SvgNode[]) {
    super(element, children)
  }

  get rx(): number {
    return parseFloat(getAttribute(this.element, 'rx'))
  }
  get ry(): number {
    return parseFloat(getAttribute(this.element, 'ry'))
  }
}
