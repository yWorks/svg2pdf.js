import { AttributeState } from './attributestate'
import { svgNamespaceURI } from '../utils/constants'

type TextMeasureFunction = (
  text: string,
  fontFamily: string,
  fontSize: string,
  fontStyle: string,
  fontWeight: string
) => number

export class TextMeasure {
  private textMeasuringTextElement: SVGTextElement = null
  private measureMethods: { [key: string]: TextMeasureFunction } = {}

  private static readonly testString =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789!"$%&/()=?\'\\+*-_.:,;^}][{#~|<>'
  private static readonly epsilon = 0.1

  getTextOffset(text: string, attributeState: AttributeState): number {
    const textAnchor = attributeState.textAnchor
    if (textAnchor === 'start') {
      return 0
    }

    const width = this.measureTextWidth(text, attributeState)

    let xOffset = 0
    switch (textAnchor) {
      case 'end':
        xOffset = width
        break
      case 'middle':
        xOffset = width / 2
        break
    }

    return xOffset
  }

  measureTextWidth(text: string, attributeState: AttributeState): number {
    if (text.length === 0) {
      return 0
    }

    const fontFamily = attributeState.fontFamily
    const measure = this.getMeasureFunction(fontFamily)

    return measure.call(
      this,
      text,
      attributeState.fontFamily,
      attributeState.fontSize + 'px',
      attributeState.fontStyle,
      attributeState.fontWeight
    )
  }

  private getMeasurementTextNode(): SVGTextElement {
    if (!this.textMeasuringTextElement) {
      this.textMeasuringTextElement = document.createElementNS(svgNamespaceURI, 'text')

      const svg = document.createElementNS(svgNamespaceURI, 'svg')
      svg.appendChild(this.textMeasuringTextElement)

      svg.style.setProperty('position', 'absolute')
      svg.style.setProperty('visibility', 'hidden')
      document.body.appendChild(svg)
    }

    return this.textMeasuringTextElement
  }

  private canvasTextMeasure(
    text: string,
    fontFamily: string,
    fontSize: any,
    fontStyle: string,
    fontWeight: string
  ): number {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    context.font = [fontStyle, fontWeight, fontSize, fontFamily].join(' ')
    return context.measureText(text).width
  }

  private svgTextMeasure(
    text: string,
    fontFamily: string,
    fontSize: any,
    fontStyle: string,
    fontWeight: string,
    measurementTextNode: SVGTextElement = this.getMeasurementTextNode()
  ): number {
    const textNode = measurementTextNode
    textNode.setAttribute('font-family', fontFamily)
    textNode.setAttribute('font-size', fontSize)
    textNode.setAttribute('font-style', fontStyle)
    textNode.setAttribute('font-weight', fontWeight)
    textNode.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve')
    textNode.textContent = text

    return textNode.getBBox().width
  }

  /**
   * Canvas text measuring is a lot faster than svg measuring. However, it is inaccurate for some fonts. So test each
   * font once and decide if canvas is accurate enough.
   */
  private getMeasureFunction(fontFamily: string): TextMeasureFunction {
    let method = this.measureMethods[fontFamily]
    if (!method) {
      const fontSize = '16px'
      const fontStyle = 'normal'
      const fontWeight = 'normal'
      const canvasWidth = this.canvasTextMeasure(
        TextMeasure.testString,
        fontFamily,
        fontSize,
        fontStyle,
        fontWeight
      )
      const svgWidth = this.svgTextMeasure(
        TextMeasure.testString,
        fontFamily,
        fontSize,
        fontStyle,
        fontWeight
      )

      method =
        Math.abs(canvasWidth - svgWidth) < TextMeasure.epsilon
          ? this.canvasTextMeasure
          : this.svgTextMeasure

      this.measureMethods[fontFamily] = method
    }

    return method
  }

  cleanupTextMeasuring(): void {
    if (this.textMeasuringTextElement) {
      document.body.removeChild(this.textMeasuringTextElement.parentNode)
      this.textMeasuringTextElement = null
    }
  }
}
