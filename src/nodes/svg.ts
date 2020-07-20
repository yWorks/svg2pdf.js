import { Context } from '../context/context'
import { parseFloats } from '../utils/parsing'
import { getAttribute, svgNodeAndChildrenVisible } from '../utils/node'
import { ContainerNode } from './containernode'
import { computeViewBoxTransform, parseTransform } from '../utils/transform'
import { Matrix } from 'jspdf'

export class Svg extends ContainerNode {
  isVisible(parentVisible: boolean, context: Context): boolean {
    return svgNodeAndChildrenVisible(this, parentVisible, context)
  }

  async render(context: Context): Promise<void> {
    if (!this.isVisible(context.attributeState.visibility !== 'hidden', context)) {
      return
    }

    const x = parseFloat(getAttribute(this.element, context.styleSheets, 'x') || '0')
    const y = parseFloat(getAttribute(this.element, context.styleSheets, 'y') || '0')
    const width = parseFloat(getAttribute(this.element, context.styleSheets, 'width') || '0')
    const height = parseFloat(getAttribute(this.element, context.styleSheets, 'height') || '0')

    context.pdf.saveGraphicsState()

    let transform: Matrix = context.transform
    if (this.element.hasAttribute('transform')) {
      // SVG 2 allows transforms on SVG elements
      // "The transform should be applied as if the ‘svg’ had a parent element with that transform set."

      transform = context.pdf.matrixMult(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        parseTransform(this.element.getAttribute('transform')!, context),
        transform
      )
    }

    context.pdf.setCurrentTransformationMatrix(transform)

    if (
      !context.withinUse &&
      getAttribute(this.element, context.styleSheets, 'overflow') !== 'visible'
    ) {
      // establish a new viewport
      context.pdf
        .rect(x, y, width, height)
        .clip()
        .discardPath()
    }

    await super.render(context.clone({ transform: context.pdf.unitMatrix }))

    context.pdf.restoreGraphicsState()
  }

  computeNodeTransform(context: Context): Matrix {
    return this.computeNodeTransformCore(context)
  }

  protected computeNodeTransformCore(context: Context): Matrix {
    if (context.withinUse) {
      return context.pdf.unitMatrix
    }

    const x = parseFloat(getAttribute(this.element, context.styleSheets, 'x') || '0')
    const y = parseFloat(getAttribute(this.element, context.styleSheets, 'y') || '0')

    const viewBox = this.element.getAttribute('viewBox')
    let nodeTransform
    if (viewBox) {
      const box = parseFloats(viewBox)
      const width = parseFloat(getAttribute(this.element, context.styleSheets, 'width') || '0')
      const height = parseFloat(getAttribute(this.element, context.styleSheets, 'height') || '0')
      nodeTransform = computeViewBoxTransform(this.element, box, x, y, width, height, context)
    } else {
      nodeTransform = context.pdf.Matrix(1, 0, 0, 1, x, y)
    }
    return nodeTransform
  }
}
