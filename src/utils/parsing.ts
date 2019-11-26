/**
 * parses a comma, sign and/or whitespace separated string of floats and returns
 * the single floats in an array
 */
import { RGBColor } from './rgbcolor'
import { Point } from './geometry'

export function parseFloats(str: string): number[] {
  const floats = []
  const regex = /[+-]?(?:(?:\d+\.?\d*)|(?:\d*\.?\d+))(?:[eE][+-]?\d+)?/g
  let match
  while ((match = regex.exec(str))) {
    floats.push(parseFloat(match[0]))
  }
  return floats
}

// parses the "points" string used by polygons and returns an array of points
export function parsePointsString(string: string): Point[] {
  const floats = parseFloats(string)
  const result = []
  for (let i = 0; i < floats.length - 1; i += 2) {
    const x = floats[i]
    const y = floats[i + 1]
    result.push([x, y])
  }
  return result
}

// extends RGBColor by rgba colors as RGBColor is not capable of it
export function parseColor(colorString: string): RGBColor {
  if (colorString === 'transparent') {
    const transparent = new RGBColor('rgb(0,0,0)')
    transparent.a = 0
    return transparent
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
