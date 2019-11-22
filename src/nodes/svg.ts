import { Context } from '../context/context'
import { parseFloats } from '../utils/math'
import { getAttribute, svgNodeAndChildrenVisible } from '../utils/node'
import { ContainerNode } from './containernode'

export class Svg extends ContainerNode {
  protected getBoundingBoxCore(context: Context) {
    const viewBox = this.element.getAttribute('viewBox')
    let vb
    if (viewBox) {
      vb = parseFloats(viewBox)
    }
    return [
      parseFloat(getAttribute(this.element, 'x', context.styleSheets)) || (vb && vb[0]) || 0,
      parseFloat(getAttribute(this.element, 'y', context.styleSheets)) || (vb && vb[1]) || 0,
      parseFloat(getAttribute(this.element, 'width', context.styleSheets)) || (vb && vb[2]) || 0,
      parseFloat(getAttribute(this.element, 'height', context.styleSheets)) || (vb && vb[3]) || 0
    ]
  }
  isVisible(parentVisible: boolean, context:Context): boolean {
    return svgNodeAndChildrenVisible(this, parentVisible, context)
  }
}
