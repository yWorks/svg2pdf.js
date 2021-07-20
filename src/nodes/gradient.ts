import { Context } from '../context/context'
import { defaultBoundingBox } from '../utils/bbox'
import { NonRenderedNode } from './nonrenderednode'
import { getAttribute, svgNodeAndChildrenVisible } from '../utils/node'
import { Rect } from '../utils/geometry'
import { RGBColor } from '../utils/rgbcolor'
import { SvgNode } from './svgnode'
import { GState, Matrix, ShadingPattern, ShadingPatternType } from 'jspdf'
import { parseColor } from '../utils/parsing'
import { StyleSheets } from '../context/stylesheets'

export abstract class Gradient extends NonRenderedNode {
  private readonly pdfGradientType: ShadingPatternType
  private contextColor: RGBColor | null | undefined
  private stops: StopData[] | undefined

  protected constructor(
    pdfGradientType: ShadingPatternType,
    element: Element,
    children: SvgNode[]
  ) {
    super(element, children)
    this.pdfGradientType = pdfGradientType
    this.contextColor = undefined
  }

  async apply(context: Context): Promise<void> {
    const id = this.element.getAttribute('id')
    if (!id) {
      return
    }

    const colors: StopData[] = this.getStops(context.styleSheets)
    let opacitySum = 0
    let hasOpacity = false
    let gState

    colors.forEach(({ opacity }) => {
      if (opacity && opacity !== 1) {
        opacitySum += opacity
        hasOpacity = true
      }
    })

    if (hasOpacity) {
      gState = new GState({ opacity: opacitySum / colors.length })
    }

    const pattern = new ShadingPattern(this.pdfGradientType, this.getCoordinates(), colors, gState)
    context.pdf.addShadingPattern(id, pattern)
  }

  abstract getCoordinates(): number[]

  public getStops(styleSheets: StyleSheets): StopData[] {
    if (this.stops) {
      return this.stops
    }

    // Only need to calculate contextColor once
    if (this.contextColor === undefined) {
      this.contextColor = null
      let ancestor: SvgNode | null = this as SvgNode
      while (ancestor) {
        const colorAttr = getAttribute(ancestor.element, styleSheets, 'color')
        if (colorAttr) {
          this.contextColor = parseColor(colorAttr, null)
          break
        }
        ancestor = ancestor.getParent()
      }
    }

    const stops: StopData[] = []
    this.children.forEach(stop => {
      if (stop.element.tagName.toLowerCase() === 'stop') {
        const colorAttr = getAttribute(stop.element, styleSheets, 'color')
        const color = parseColor(
          getAttribute(stop.element, styleSheets, 'stop-color') || '',
          colorAttr ? parseColor(colorAttr, null) : (this.contextColor as RGBColor | null)
        )
        const opacity = parseFloat(getAttribute(stop.element, styleSheets, 'stop-opacity') || '1')
        stops.push({
          offset: Gradient.parseGradientOffset(stop.element.getAttribute('offset') || '0'),
          color: [color.r, color.g, color.b],
          opacity
        })
      }
    })

    return (this.stops = stops)
  }

  protected getBoundingBoxCore(context: Context): Rect {
    return defaultBoundingBox(this.element, context)
  }
  protected computeNodeTransformCore(context: Context): Matrix {
    return context.pdf.unitMatrix
  }
  isVisible(parentVisible: boolean, context: Context): boolean {
    return svgNodeAndChildrenVisible(this, parentVisible, context)
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

export interface StopData {
  color: number[]
  opacity: number
  offset: number
}
