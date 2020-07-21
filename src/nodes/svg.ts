import { Context } from '../context/context'
import { parseFloats } from '../utils/parsing'
import { getAttribute, svgNodeAndChildrenVisible } from '../utils/node'
import { ContainerNode } from './containernode'
import { computeViewBoxTransform, parseTransform } from '../utils/transform'
import { Matrix } from 'jspdf'
import { Viewport } from '../context/viewport'
import { Rect } from '../utils/geometry'

export class Svg extends ContainerNode {
  isVisible(parentVisible: boolean, context: Context): boolean {
    return svgNodeAndChildrenVisible(this, parentVisible, context)
  }

  async render(context: Context): Promise<void> {
    if (!this.isVisible(context.attributeState.visibility !== 'hidden', context)) {
      return
    }

    const x = this.getX(context)
    const y = this.getY(context)
    const width = this.getWidth(context)
    const height = this.getHeight(context)

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

    await super.render(
      context.clone({
        transform: context.pdf.unitMatrix,
        viewport: context.withinUse ? context.viewport : new Viewport(width, height)
      })
    )

    context.pdf.restoreGraphicsState()
  }

  computeNodeTransform(context: Context): Matrix {
    return this.computeNodeTransformCore(context)
  }

  protected computeNodeTransformCore(context: Context): Matrix {
    if (context.withinUse) {
      return context.pdf.unitMatrix
    }

    const x = this.getX(context)
    const y = this.getY(context)

    const viewBox = this.getViewBox()
    let nodeTransform
    if (viewBox) {
      const width = this.getWidth(context)
      const height = this.getHeight(context)
      nodeTransform = computeViewBoxTransform(this.element, viewBox, x, y, width, height, context)
    } else {
      nodeTransform = context.pdf.Matrix(1, 0, 0, 1, x, y)
    }
    return nodeTransform
  }

  private width: number | undefined
  private getWidth(context: Context) {
    if (this.width !== undefined) {
      return this.width
    }

    let width: number

    const parameters = context.svg2pdfParameters
    if (this.isOutermostSvg(context)) {
      // special treatment for the outermost SVG element
      if (parameters.width != null) {
        // if there is a user defined width, use it
        width = parameters.width
      } else {
        // otherwise check if the SVG element defines the width itself
        const widthAttr = getAttribute(this.element, context.styleSheets, 'width')
        if (widthAttr) {
          width = parseFloat(widthAttr)
        } else {
          // if not, check if we can figure out the aspect ratio from the viewBox attribute
          const viewBox = this.getViewBox()
          if (
            viewBox &&
            (parameters.height != null || getAttribute(this.element, context.styleSheets, 'height'))
          ) {
            // if there is a viewBox and the height is defined, use the width that matches the height together with the aspect ratio
            const aspectRatio = viewBox[2] / viewBox[3]
            width = this.getHeight(context) * aspectRatio
          } else {
            // if there is no viewBox use a default of 300 or the largest size that fits into the outer viewport
            // at an aspect ratio of 2:1
            width = Math.min(300, context.viewport.width, context.viewport.height * 2)
          }
        }
      }
    } else {
      const widthAttr = getAttribute(this.element, context.styleSheets, 'width')
      width = widthAttr ? parseFloat(widthAttr) : context.viewport.width
    }

    return (this.width = width)
  }

  private height: number | undefined
  private getHeight(context: Context) {
    if (this.height !== undefined) {
      return this.height
    }

    let height: number

    const parameters = context.svg2pdfParameters
    if (this.isOutermostSvg(context)) {
      // special treatment for the outermost SVG element
      if (parameters.height != null) {
        // if there is a user defined height, use it
        height = parameters.height
      } else {
        // otherwise check if the SVG element defines the height itself
        const heightAttr = getAttribute(this.element, context.styleSheets, 'height')
        if (heightAttr) {
          height = parseFloat(heightAttr)
        } else {
          // if not, check if we can figure out the aspect ratio from the viewBox attribute
          const viewBox = this.getViewBox()
          if (viewBox) {
            // if there is a viewBox, use the height that matches the width together with the aspect ratio
            const aspectRatio = viewBox[2] / viewBox[3]
            height = this.getWidth(context) / aspectRatio
          } else {
            // if there is no viewBox use a default of 150 or the largest size that fits into the outer viewport
            // at an aspect ratio of 2:1
            height = Math.min(150, context.viewport.width / 2, context.viewport.height)
          }
        }
      }
    } else {
      const heightAttr = getAttribute(this.element, context.styleSheets, 'height')
      height = heightAttr ? parseFloat(heightAttr) : context.viewport.height
    }

    return (this.height = height)
  }

  private x: number | undefined
  private getX(context: Context) {
    if (this.x !== undefined) {
      return this.x
    }
    if (this.isOutermostSvg(context)) {
      return (this.x = 0)
    }
    const xAttr = getAttribute(this.element, context.styleSheets, 'x')
    return (this.x = xAttr ? parseFloat(xAttr) : 0)
  }

  private y: number | undefined
  private getY(context: Context) {
    if (this.y !== undefined) {
      return this.y
    }
    if (this.isOutermostSvg(context)) {
      return (this.y = 0)
    }
    const yAttr = getAttribute(this.element, context.styleSheets, 'y')
    return (this.y = yAttr ? parseFloat(yAttr) : 0)
  }

  private viewBox: Rect | undefined
  private getViewBox(): Rect | undefined {
    if (this.viewBox !== undefined) {
      return this.viewBox
    }

    const viewBox = this.element.getAttribute('viewBox')
    return (this.viewBox = viewBox ? parseFloats(viewBox) : undefined)
  }

  private isOutermostSvg(context: Context) {
    return context.svg2pdfParameters.element === this.element
  }
}
