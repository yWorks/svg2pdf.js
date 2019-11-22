import { AttributeState } from '../context/attributestate'
import { getAttribute } from './node'
import { Context } from '../context/context'

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

// applies text transformations to a text node
export function transformText(node: HTMLElement, text: string, context:Context) {
  const textTransform = getAttribute(node, 'text-transform', context.styleSheets)
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
