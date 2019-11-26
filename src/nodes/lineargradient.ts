import { Gradient } from './gradient'
import { Context } from '../context/context'
import { putGradient } from '../utils/patterngradient'

export class LinearGradient extends Gradient {
  apply(context: Context): void {
    putGradient(
      this.element,
      'axial',
      [
        this.element.getAttribute('x1') || 0,
        this.element.getAttribute('y1') || 0,
        this.element.getAttribute('x2') || 1,
        this.element.getAttribute('y2') || 0
      ],
      context
    )
  }
}
