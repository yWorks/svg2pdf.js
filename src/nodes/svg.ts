import { Context } from '../context/context'
import { parseFloats } from '../utils/math'
import { getAttribute } from '../utils/node'
import { Groups } from './groups'

export class Svg extends Groups {
  getBoundingBoxCore(context: Context) {
    const viewBox = this.element.getAttribute('viewBox')
    let vb
    if (viewBox) {
      vb = parseFloats(viewBox)
    }
    return [
      parseFloat(getAttribute(this.element, 'x')) || (vb && vb[0]) || 0,
      parseFloat(getAttribute(this.element, 'y')) || (vb && vb[1]) || 0,
      parseFloat(getAttribute(this.element, 'width')) || (vb && vb[2]) || 0,
      parseFloat(getAttribute(this.element, 'height')) || (vb && vb[3]) || 0
    ]
  }
  visibleCore(visible: boolean) {
    return this.childrenVisible(visible)
  }
}
