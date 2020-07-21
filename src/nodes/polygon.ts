import { Traverse } from './traverse'
import { SvgNode } from './svgnode'

export class Polygon extends Traverse {
  constructor(node: Element, children: SvgNode[]) {
    super(true, node, children)
  }
}
