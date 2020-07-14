import { Traverse } from './traverse'
import { SvgNode } from './svgnode'

export class Polyline extends Traverse {
  constructor(node: HTMLElement, children: SvgNode[]) {
    super(false, node, children)
  }
}
