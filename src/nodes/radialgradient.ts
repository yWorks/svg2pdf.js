import { Gradient } from './gradient'
import { Context } from '../context/context'
import { putGradient } from '../utils/patterngradient'

export class RadialGradient extends Gradient {
  apply(context: Context) {
    putGradient(
      this.element,
      'radial',
      [
        this.element.getAttribute('fx') || this.element.getAttribute('cx') || 0.5,
        this.element.getAttribute('fy') || this.element.getAttribute('cy') || 0.5,
        0,
        this.element.getAttribute('cx') || 0.5,
        this.element.getAttribute('cy') || 0.5,
        this.element.getAttribute('r') || 0.5
      ],
      context
    )
  }
}
