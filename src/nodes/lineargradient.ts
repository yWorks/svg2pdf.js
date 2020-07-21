import { Gradient } from './gradient'
import { SvgNode } from './svgnode'

export class LinearGradient extends Gradient {
  constructor(element: Element, children: SvgNode[]) {
    super('axial', element, children)
  }

  getCoordinates(): number[] {
    return [
      parseFloat(this.element.getAttribute('x1') || '0'),
      parseFloat(this.element.getAttribute('y1') || '0'),
      parseFloat(this.element.getAttribute('x2') || '1'),
      parseFloat(this.element.getAttribute('y2') || '0')
    ]
  }
}
