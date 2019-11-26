import { Context } from '../context/context'
import { parseFloats } from '../utils/parsing'
import { getAttribute, svgNodeAndChildrenVisible } from '../utils/node'
import { ContainerNode } from './containernode'
import { computeViewBoxTransform } from '../utils/transform'
import { Rect } from '../utils/geometry'

export class Svg extends ContainerNode {
  protected getBoundingBoxCore(context: Context): Rect {
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

  isVisible(parentVisible: boolean): boolean {
    return svgNodeAndChildrenVisible(this, parentVisible)
  }

  protected computeNodeTransformCore(context: Context): any {
    const x = parseFloat(getAttribute(this.element, 'x')) || 0
    const y = parseFloat(getAttribute(this.element, 'y')) || 0

    const viewBox = this.element.getAttribute('viewBox')
    let nodeTransform
    if (viewBox) {
      const box = parseFloats(viewBox)
      const width = parseFloat(getAttribute(this.element, 'width')) || box[2]
      const height = parseFloat(getAttribute(this.element, 'height')) || box[3]
      nodeTransform = computeViewBoxTransform(this.element, box, x, y, width, height, context)
    } else {
      nodeTransform = new context.pdf.Matrix(1, 0, 0, 1, x, y)
    }
    return nodeTransform
  }
}
