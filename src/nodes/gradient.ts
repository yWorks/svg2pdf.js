import { Context } from '../context/context'
import { defaultBoundingBox } from '../utils/bbox'
import { NonRenderedNode } from './nonrenderednode'
import { getAttribute, svgNodeAndChildrenVisible } from '../utils/node'
import { Rect } from '../utils/geometry'
import { RGBColor } from '../utils/rgbcolor'
import { SvgNode } from './svgnode'
import { Matrix, ShadingPatternType } from 'jspdf-yworks'

export abstract class Gradient extends NonRenderedNode {
  private readonly pdfGradientType: ShadingPatternType

  protected constructor(
    pdfGradientType: ShadingPatternType,
    element: HTMLElement,
    children: SvgNode[]
  ) {
    super(element, children)
    this.pdfGradientType = pdfGradientType
  }

  async apply(context: Context): Promise<void> {
    const id = this.element.getAttribute('id')
    if (!id) {
      return
    }

    const colors: StopData[] = []
    let opacitySum = 0
    let hasOpacity = false
    let gState

    this.children.forEach(stop => {
      if (stop.element.tagName.toLowerCase() === 'stop') {
        const color = new RGBColor(getAttribute(stop.element, 'stop-color'))
        colors.push({
          offset: Gradient.parseGradientOffset(stop.element.getAttribute('offset') || '0'),
          color: [color.r, color.g, color.b]
        })
        const opacity = getAttribute(stop.element, 'stop-opacity')
        if (opacity && opacity !== '1') {
          opacitySum += parseFloat(opacity)
          hasOpacity = true
        }
      }
    })

    if (hasOpacity) {
      gState = context.pdf.GState({ opacity: opacitySum / colors.length })
    }

    const pattern = context.pdf.ShadingPattern(
      this.pdfGradientType,
      this.getCoordinates(),
      colors,
      gState
    )
    context.pdf.addShadingPattern(id, pattern)
  }

  abstract getCoordinates(): number[]

  protected getBoundingBoxCore(context: Context): Rect {
    return defaultBoundingBox(this.element)
  }
  protected computeNodeTransformCore(context: Context): Matrix {
    return context.pdf.unitMatrix
  }
  isVisible(parentVisible: boolean): boolean {
    return svgNodeAndChildrenVisible(this, parentVisible)
  }

  /**
   * Convert percentage to decimal
   */
  static parseGradientOffset(value: string): number {
    const parsedValue = parseFloat(value)
    if (!isNaN(parsedValue) && value.indexOf('%') >= 0) {
      return parsedValue / 100
    }
    return parsedValue
  }
}

interface StopData {
  color: number[]
  offset: number
}
