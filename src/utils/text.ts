import { AttributeState } from '../context/attributestate'
import { Context } from '../context/context'
import { fontAliases } from './constants'
import FontFamily from 'font-family-papandreou'
import { RGBColor } from './rgbcolor'
import { getAttribute } from './node'
import { findFirstAvailableFontFamily } from './misc'

/**
 * @param {string} text
 * @param {AttributeState} attributeState
 * @returns {number}
 */

/**
 * @param {AttributeState} attributeState
 * @param {AttributeState} parentAttributeState
 */
export function putTextProperties(
  attributeState: AttributeState,
  parentAttributeState: AttributeState,
  context: Context
) {
  if (attributeState.fontFamily !== parentAttributeState.fontFamily) {
    if (fontAliases.hasOwnProperty(attributeState.fontFamily)) {
      context._pdf.setFont(fontAliases[attributeState.fontFamily])
    } else {
      context._pdf.setFont(attributeState.fontFamily)
    }
  }

  if (
    attributeState.fill &&
    attributeState.fill !== parentAttributeState.fill &&
    attributeState.fill.ok
  ) {
    const fillRGB = attributeState.fill
    context._pdf.setTextColor(fillRGB.r, fillRGB.g, fillRGB.b)
  }

  if (
    attributeState.fontWeight !== parentAttributeState.fontWeight ||
    attributeState.fontStyle !== parentAttributeState.fontStyle
  ) {
    let fontType = ''
    if (attributeState.fontWeight === 'bold') {
      fontType = 'bold'
    }
    if (attributeState.fontStyle === 'italic') {
      fontType += 'italic'
    }

    if (fontType === '') {
      fontType = 'normal'
    }

    context._pdf.setFontType(fontType)
  }

  if (attributeState.fontSize !== parentAttributeState.fontSize) {
    // correct for a jsPDF-instance measurement unit that differs from `pt`
    context._pdf.setFontSize(attributeState.fontSize * context._pdf.internal.scaleFactor)
  }
}

export function getTextRenderingMode(attributeState: AttributeState) {
  let renderingMode = 'invisible'
  if (attributeState.fill && attributeState.stroke) {
    renderingMode = 'fillThenStroke'
  } else if (attributeState.fill) {
    renderingMode = 'fill'
  } else if (attributeState.stroke) {
    renderingMode = 'stroke'
  }
  return renderingMode
}

/**
 * Outputs the chunk to pdf.
 * @param {jsPDF.Matrix} transform
 * @param {AttributeState} attributeState
 * @returns {[number, number]} The last current text position.
 */

export function transformXmlSpace(trimmedText: string, attributeState: AttributeState) {
  trimmedText = removeNewlines(trimmedText)
  trimmedText = replaceTabsBySpace(trimmedText)

  if (attributeState.xmlSpace === 'default') {
    trimmedText = trimmedText.trim()
    trimmedText = consolidateSpaces(trimmedText)
  }

  return trimmedText
}

export function removeNewlines(str: string) {
  return str.replace(/[\n\r]/g, '')
}

export function replaceTabsBySpace(str: string) {
  return str.replace(/[\t]/g, ' ')
}

export function consolidateSpaces(str: string) {
  return str.replace(/ +/g, ' ')
}

export function setTextProperties(node: HTMLElement, fillRGB: RGBColor, context: Context) {
  if (fillRGB && fillRGB.ok) {
    context.attributeState.fill = fillRGB
  }

  const fontWeight = getAttribute(node, 'font-weight')
  if (fontWeight) {
    context.attributeState.fontWeight = fontWeight
  }

  const fontStyle = getAttribute(node, 'font-style')
  if (fontStyle) {
    context.attributeState.fontStyle = fontStyle
  }

  const fontFamily = getAttribute(node, 'font-family')
  if (fontFamily) {
    const fontFamilies = FontFamily.parse(fontFamily)
    context.attributeState.fontFamily = findFirstAvailableFontFamily(
      context.attributeState,
      fontFamilies,
      context
    )
  }

  const fontSize = getAttribute(node, 'font-size')
  if (fontSize) {
    context.attributeState.fontSize = parseFloat(fontSize)
  }

  const alignmentBaseline =
    getAttribute(node, 'vertical-align') || getAttribute(node, 'alignment-baseline')
  if (alignmentBaseline) {
    const matchArr = alignmentBaseline.match(
      /(baseline|text-bottom|alphabetic|ideographic|middle|central|mathematical|text-top|bottom|center|top|hanging)/
    )
    if (matchArr) {
      context.attributeState.alignmentBaseline = matchArr[0]
    }
  }

  const textAnchor = getAttribute(node, 'text-anchor')
  if (textAnchor) {
    context.attributeState.textAnchor = textAnchor
  }
}

// applies text transformations to a text node
export function transformText(node: HTMLElement, text: string) {
  const textTransform = getAttribute(node, 'text-transform')
  switch (textTransform) {
    case 'uppercase':
      return text.toUpperCase()
    case 'lowercase':
      return text.toLowerCase()
    default:
      return text
    // TODO: capitalize, full-width
  }
}

export function trimLeft(str: string) {
  return str.replace(/^\s+/, '')
}

export function trimRight(str: string) {
  return str.replace(/\s+$/, '')
}
