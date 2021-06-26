/**
 * @function combineFontStyleAndFontWeight
 * @param {string} fontStyle Fontstyle or variant. Example: "italic".
 * @param {number | string} fontWeight Weight of the Font. Example: "normal" | 400
 * @returns {string}
 */
export function combineFontStyleAndFontWeight(
  fontStyle: string,
  fontWeight: number | string
): string {
  if (
    (fontStyle == 'bold' && fontWeight == 'normal') ||
    (fontStyle == 'bold' && fontWeight == 400) ||
    (fontStyle == 'normal' && fontWeight == 'italic') ||
    (fontStyle == 'bold' && fontWeight == 'italic')
  ) {
    throw new Error('Invalid Combination of fontweight and fontstyle')
  }
  if (fontWeight && fontStyle !== fontWeight) {
    //if fontstyle is normal and fontweight is normal too no need to append the font-weight
    fontStyle =
      fontWeight == 400
        ? fontStyle == 'italic'
          ? 'italic'
          : 'normal'
        : fontWeight == 700 && fontStyle !== 'italic'
        ? 'bold'
        : fontStyle + '' + fontWeight
  }
  return fontStyle
}
