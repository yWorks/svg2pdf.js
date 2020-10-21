/**
 * parses a comma, sign and/or whitespace separated string of floats and returns
 * the single floats in an array
 */
import { Context } from '../context/context'
import { RGBColor } from './rgbcolor'

export function parseFloats(str: string): number[] {
  const floats = []
  const regex = /[+-]?(?:(?:\d+\.?\d*)|(?:\d*\.?\d+))(?:[eE][+-]?\d+)?/g
  let match
  while ((match = regex.exec(str))) {
    floats.push(parseFloat(match[0]))
  }
  return floats
}

// extends RGBColor by rgba colors as RGBColor is not capable of it
export function parseColor(colorString: string, context: Context): RGBColor {
  if (colorString === 'transparent') {
    const transparent = new RGBColor('rgb(0,0,0)')
    transparent.a = 0
    return transparent
  }

  if (colorString === 'currentcolor') {
    if (context.attributeState.color) {
      return context.attributeState.color.color
    } else {
      // if the color is null, return black
      return new RGBColor('rgb(0, 0, 0)')
    }
  }

  const match = /\s*rgba\(((?:[^,\)]*,){3}[^,\)]*)\)\s*/.exec(colorString)
  if (match) {
    const floats = parseFloats(match[1])
    const color = new RGBColor('rgb(' + floats.slice(0, 3).join(',') + ')')
    color.a = floats[3]
    return color
  } else {
    return new RGBColor(colorString)
  }
}
