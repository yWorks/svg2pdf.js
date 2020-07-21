import { Gradient } from './gradient'
import { SvgNode } from './svgnode'

export class RadialGradient extends Gradient {
  constructor(element: Element, children: SvgNode[]) {
    super('radial', element, children)
  }

  getCoordinates(): number[] {
    const cx = this.element.getAttribute('cx')
    const cy = this.element.getAttribute('cy')
    const fx = this.element.getAttribute('fx')
    const fy = this.element.getAttribute('fy')
    return [
      parseFloat(fx || cx || '0.5'),
      parseFloat(fy || cy || '0.5'),
      0,
      parseFloat(cx || '0.5'),
      parseFloat(cy || '0.5'),
      parseFloat(this.element.getAttribute('r') || '0.5')
    ]
  }
}
