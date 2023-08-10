import { AttributeState } from '../context/attributestate'
import { getAttribute } from './node'
import { TextOptionsLight } from 'jspdf'
import { Context } from '../context/context'

// capture type...
let tol: TextOptionsLight
type TextRenderingMode = typeof tol.renderingMode

export function getTextRenderingMode(attributeState: AttributeState): TextRenderingMode {
  let renderingMode: TextRenderingMode = 'invisible'
  if (attributeState.fill && attributeState.stroke && attributeState.strokeWidth !== 0) {
    renderingMode = 'fillThenStroke'
  } else if (attributeState.fill) {
    renderingMode = 'fill'
  } else if (attributeState.stroke) {
    renderingMode = 'stroke'
  }
  return renderingMode
}

export function transformXmlSpace(trimmedText: string, attributeState: AttributeState): string {
  trimmedText = removeNewlines(trimmedText)
  trimmedText = replaceTabsBySpace(trimmedText)

  if (attributeState.xmlSpace === 'default') {
    trimmedText = trimmedText.trim()
    trimmedText = consolidateSpaces(trimmedText)
  }

  return trimmedText
}

export function removeNewlines(str: string): string {
  return str.replace(/[\n\r]/g, '')
}

export function replaceTabsBySpace(str: string): string {
  return str.replace(/[\t]/g, ' ')
}

export function consolidateSpaces(str: string): string {
  return str.replace(/ +/g, ' ')
}

// applies text transformations to a text node
export function transformText(node: Element, text: string, context: Context): string {
  const textTransform = getAttribute(node, context.styleSheets, 'text-transform')
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

export function trimLeft(str: string): string {
  return str.replace(/^\s+/, '')
}

export function trimRight(str: string): string {
  return str.replace(/\s+$/, '')
}
