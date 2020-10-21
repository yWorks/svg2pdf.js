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

export function parseFill(fill: string, context: Context): Fill | null {
  const url = iriReference.exec(fill)
  if (url) {
    const fillUrl = url[1]
    const fillNode = context.refsHandler.get(fillUrl)
    if (fillNode && (fillNode instanceof LinearGradient || fillNode instanceof RadialGradient)) {
      return new GradientFill(fillUrl, fillNode)
    } else if (fillNode && fillNode instanceof Pattern) {
      return new PatternFill(fillUrl, fillNode)
    } else {
      // unsupported fill argument -> fill black
      return new ColorFill(new RGBColor('rgb(0, 0, 0)'))
    }
  } else {
    // plain color
    const fillColor = parseColor(fill, context)
    if (fillColor.ok) {
      return new ColorFill(fillColor)
    } else if (fill === 'none') {
      return null
    } else {
      return null
    }
  }
}
