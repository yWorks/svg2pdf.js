import { Context } from '../context/context'
import { defaultBoundingBox } from '../utils/bbox'
import { NonRenderedNode } from './nonrenderednode'
import { getAttribute, svgNodeAndChildrenVisible } from '../utils/node'
import { Rect } from '../utils/geometry'
import { RGBColor } from '../utils/rgbcolor'
import { SvgNode } from './svgnode'

export abstract class Gradient extends NonRenderedNode {
  private readonly pdfGradientType: string

  protected constructor(pdfGradientType: string, element: HTMLElement, children: SvgNode[]) {
    super(element, children)
    this.pdfGradientType = pdfGradientType
  }

  apply(context: Context): void {
    const colors: StopData[] = []
    let opacitySum = 0
    let hasOpacity = false
    let gState

    this.children.forEach(stop => {
      if (stop.element.tagName.toLowerCase() === 'stop') {
        const color = new RGBColor(getAttribute(stop.element, 'stop-color'))
        colors.push({
          offset: Gradient.parseGradientOffset(stop.element.getAttribute('offset')),
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
      gState = new context.pdf.GState({ opacity: opacitySum / colors.length })
    }

    const pattern = new context.pdf.ShadingPattern(
      this.pdfGradientType,
      this.getCoordinates(),
      colors,
      gState
    )
    const id = this.element.getAttribute('id')
    context.pdf.addShadingPattern(id, pattern)
  }

  abstract getCoordinates(): number[]

  protected getBoundingBoxCore(context: Context): Rect {
    return defaultBoundingBox(this.element)
  }
  protected computeNodeTransformCore(context: Context): any {
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
