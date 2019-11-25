import { Traverse } from './traverse'
import { SvgNode } from './svgnode'

export class Polygon extends Traverse {
  constructor(node: HTMLElement, children: SvgNode[]) {
    super(node, children, true)
  }
}
