import { Fill } from './Fill'
import { Context } from '../context/context'
import { iriReference } from '../utils/constants'
import { LinearGradient } from '../nodes/lineargradient'
import { RadialGradient } from '../nodes/radialgradient'
import { GradientFill } from './GradientFill'
import { Pattern } from '../nodes/pattern'
import { PatternFill } from './PatternFill'
import { ColorFill } from './ColorFill'
import { RGBColor } from '../utils/rgbcolor'
import { parseColor } from '../utils/parsing'
import { Gradient } from '../nodes/gradient'

export function parseFill(fill: string, context: Context): Fill | null {
  const url = iriReference.exec(fill)
  if (url) {
    const fillUrl = url[1]
    const fillNode = context.refsHandler.get(fillUrl)
    if (fillNode && (fillNode instanceof LinearGradient || fillNode instanceof RadialGradient)) {
      return getGradientFill(fillUrl, fillNode, context)
    } else if (fillNode && fillNode instanceof Pattern) {
      return new PatternFill(fillUrl, fillNode)
    } else {
      // unsupported fill argument -> fill black
      return new ColorFill(new RGBColor('rgb(0, 0, 0)'))
    }
  } else {
    // plain color
    const fillColor = parseColor(fill, context.attributeState)
    if (fillColor.ok) {
      return new ColorFill(fillColor)
    } else if (fill === 'none') {
      return null
    } else {
      return null
    }
  }
}

function getGradientFill(fillUrl: string, gradient: Gradient, context: Context): Fill | null {
  // "It is necessary that at least two stops are defined to have a gradient effect. If no stops are
  // defined, then painting shall occur as if 'none' were specified as the paint style. If one stop
  // is defined, then paint with the solid color fill using the color defined for that gradient
  // stop."
  const stops = gradient.getStops(context.styleSheets)
  if (stops.length === 0) {
    return null
  }
  if (stops.length === 1) {
    const stopColor = stops[0].color
    const rgbColor = new RGBColor()
    rgbColor.ok = true
    rgbColor.r = stopColor[0]
    rgbColor.g = stopColor[1]
    rgbColor.b = stopColor[2]
    rgbColor.a = stops[0].opacity
    return new ColorFill(rgbColor)
  }
  return new GradientFill(fillUrl, gradient)
}
