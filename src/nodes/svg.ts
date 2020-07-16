import { Context } from '../context/context'
import { parseFloats } from '../utils/parsing'
import { getAttribute, svgNodeAndChildrenVisible } from '../utils/node'
import { ContainerNode } from './containernode'
import { computeViewBoxTransform } from '../utils/transform'
import { Rect } from '../utils/geometry'
import { Matrix } from 'jspdf'
import { getBoundingBoxByChildren } from '../utils/bbox'

export class Svg extends ContainerNode {
  isVisible(parentVisible: boolean, context: Context): boolean {
    return svgNodeAndChildrenVisible(this, parentVisible, context)
  }

  protected computeNodeTransformCore(context: Context): Matrix {
    const x = parseFloat(getAttribute(this.element, context.styleSheets, 'x') || '0')
    const y = parseFloat(getAttribute(this.element, context.styleSheets, 'y') || '0')

    const viewBox = this.element.getAttribute('viewBox')
    let nodeTransform
    if (viewBox) {
      const box = parseFloats(viewBox)
      const width =
        parseFloat(getAttribute(this.element, context.styleSheets, 'width') || '0') || box[2]
      const height =
        parseFloat(getAttribute(this.element, context.styleSheets, 'height') || '0') || box[3]
      nodeTransform = computeViewBoxTransform(this.element, box, x, y, width, height, context)
    } else {
      nodeTransform = context.pdf.Matrix(1, 0, 0, 1, x, y)
    }
    return nodeTransform
  }
}
