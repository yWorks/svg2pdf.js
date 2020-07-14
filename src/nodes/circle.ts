import { SvgNode } from './svgnode'
import { getAttribute } from '../utils/node'
import { EllipseBase } from './ellipsebase'

export class Circle extends EllipseBase {
  private readonly r: number

  get rx(): number {
    return this.r
  }
  get ry(): number {
    return this.r
  }

  constructor(node: HTMLElement, children: SvgNode[]) {
    super(node, children)
    this.r = parseFloat(getAttribute(this.element, 'r') || '0')
  }
}
