import AttributeState from './attributestate'
import { svgNamespaceURI } from '../utils/constants'

export default class TextMeasure {
  textMeasuringTextElement: SVGTextElement

  constructor() {
    this.textMeasuringTextElement = null
  }

  /**
   * @param {string} text
   * @param {AttributeState} attributeState
   * @returns {number}
   */
  getTextOffset(text: string, attributeState: AttributeState) {
    var textAnchor = attributeState.textAnchor
    if (textAnchor === 'start') {
      return 0
    }

    var width = this.measureTextWidth(text, attributeState)

    var xOffset = 0
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

  getMeasurementTextNode(): SVGTextElement {
    if (!this.textMeasuringTextElement) {
      this.textMeasuringTextElement = document.createElementNS(svgNamespaceURI, 'text')

      var svg = document.createElementNS(svgNamespaceURI, 'svg')
      svg.appendChild(this.textMeasuringTextElement)

      svg.style.setProperty('position', 'absolute')
      svg.style.setProperty('visibility', 'hidden')
      document.body.appendChild(svg)
    }

    return this.textMeasuringTextElement
  }

  /**
   * Canvas text measuring is a lot faster than svg measuring. However, it is inaccurate for some fonts. So test each
   * font once and decide if canvas is accurate enough.
   * @param {string} text
   * @param {string} fontFamily
   * @returns {function(string, string, string, string, string)}
   */
  getMeasureFunction = (function getMeasureFunction(self: TextMeasure) {
    /**
     * @param {string} text
     * @param {string} fontFamily
     * @param {string} fontSize
     * @param {string} fontStyle
     * @param {string} fontWeight
     */
    var canvasTextMeasure = function(
      text: string,
      fontFamily: string,
      fontSize: any,
      fontStyle: string,
      fontWeight: string
    ) {
      var canvas = document.createElement('canvas')
      var context = canvas.getContext('2d')

      context.font = [fontStyle, fontWeight, fontSize, fontFamily].join(' ')
      return context.measureText(text).width
    }

    /**
     * @param {string} text
     * @param {string} fontFamily
     * @param {string} fontSize
     * @param {string} fontStyle
     * @param {string} fontWeight
     */
    var gotMeasurementTextNode = self.getMeasurementTextNode()
    var svgTextMeasure = function(
      text: string,
      fontFamily: string,
      fontSize: any,
      fontStyle: string,
      fontWeight: string,
      measurementTextNode: SVGTextElement = gotMeasurementTextNode
    ) {
      var textNode = measurementTextNode
      textNode.setAttribute('font-family', fontFamily)
      textNode.setAttribute('font-size', fontSize)
      textNode.setAttribute('font-style', fontStyle)
      textNode.setAttribute('font-weight', fontWeight)
      textNode.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve')
      textNode.textContent = text

      return textNode.getBBox().width
    }

    var testString =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789!"$%&/()=?\'\\+*-_.:,;^}][{#~|<>'
    var epsilon = 0.1
    var measureMethods = {} as any

    return function getMeasureFunction(fontFamily: string) {
      var method = measureMethods[fontFamily]
      if (!method) {
        var fontSize = '16px'
        var fontStyle = 'normal'
        var fontWeight = 'normal'
        var canvasWidth = canvasTextMeasure(testString, fontFamily, fontSize, fontStyle, fontWeight)
        var svgWidth = svgTextMeasure(testString, fontFamily, fontSize, fontStyle, fontWeight)

        method = Math.abs(canvasWidth - svgWidth) < epsilon ? canvasTextMeasure : svgTextMeasure

        measureMethods[fontFamily] = method
      }

      return method
    }
  })(this)

  measureTextWidth(text: string, attributeState: AttributeState) {
    if (text.length === 0) {
      return 0
    }

    var fontFamily = attributeState.fontFamily
    var measure = this.getMeasureFunction(fontFamily)

    return measure(
      text,
      attributeState.fontFamily,
      attributeState.fontSize + 'px',
      attributeState.fontStyle,
      attributeState.fontWeight
    )
  }
}
