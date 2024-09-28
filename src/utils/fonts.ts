/**
 * @param {AttributeState} attributeState
 * @param {string[]} fontFamilies
 * @return {string}
 */
import { AttributeState } from '../context/attributestate'
import { Context } from '../context/context'
import { jsPDF } from 'jspdf'

export type FontFamily = string

export const fontAliases: { [key: string]: string } = {
  'sans-serif': 'helvetica',
  verdana: 'helvetica',
  arial: 'helvetica',

  fixed: 'courier',
  monospace: 'courier',
  terminal: 'courier',

  serif: 'times',
  cursive: 'times',
  fantasy: 'times'
}

export function findFirstAvailableFontFamily(
  attributeState: AttributeState,
  fontFamilies: FontFamily[],
  context: Context
): FontFamily {
  const fontType = combineFontStyleAndFontWeight(
    attributeState.fontStyle,
    attributeState.fontWeight
  )

  const availableFonts = context.pdf.getFontList()
  let firstAvailable = ''
  const fontIsAvailable = fontFamilies.some(font => {
    const availableStyles = availableFonts[font]
    if (availableStyles && availableStyles.indexOf(fontType) >= 0) {
      firstAvailable = font
      return true
    }

    font = font.toLowerCase()
    if (fontAliases.hasOwnProperty(font)) {
      firstAvailable = font
      return true
    }

    return false
  })

  if (!fontIsAvailable) {
    firstAvailable = 'times'
  }

  return firstAvailable
}

const isJsPDF23: boolean = (() => {
  const parts = jsPDF.version.split('.')
  return parseFloat(parts[0]) === 2 && parseFloat(parts[1]) === 3
})()

export function combineFontStyleAndFontWeight(
  fontStyle: string,
  fontWeight: number | string
): string {
  if (isJsPDF23) {
    return fontWeight == 400
      ? fontStyle == 'italic'
        ? 'italic'
        : 'normal'
      : fontWeight == 700 && fontStyle !== 'italic'
      ? 'bold'
      : fontStyle + '' + fontWeight
  } else {
    return fontWeight == 400 || fontWeight === 'normal'
      ? fontStyle === 'italic'
        ? 'italic'
        : 'normal'
      : (fontWeight == 700 || fontWeight === 'bold') && fontStyle === 'normal'
      ? 'bold'
      : (fontWeight == 700 ? 'bold' : fontWeight) + '' + fontStyle
  }
}
