import { Traverse } from './traverse'
import { SvgNode } from './svgnode'

export class Polyline extends Traverse {
  constructor(node: Element, children: SvgNode[]) {
    super(false, node, children)
  }
}
