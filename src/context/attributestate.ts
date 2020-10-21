import { RGBColor } from '../utils/rgbcolor'
import { Fill } from '../fill/Fill'
import { ColorFill } from '../fill/ColorFill'

export class AttributeState {
  public xmlSpace = ''
  public fill: Fill | null = null
  public fillOpacity = 1.0
  // public fillRule: string = null
  public fontFamily = ''
  public fontSize = 16
  public fontStyle = ''
  // public fontVariant: string
  public fontWeight = ''
  public opacity = 1.0
  public stroke: Fill | null = null
  public strokeDasharray: number[] | null = null
  public strokeDashoffset = 0
  public strokeLinecap = ''
  public strokeLinejoin = ''
  public strokeMiterlimit = 4.0
  public strokeOpacity = 1.0
  public strokeWidth = 1.0
  // public textAlign: string
  public alignmentBaseline = ''
  public textAnchor = ''
  public visibility = ''
  public color: ColorFill | null = null

  clone(): AttributeState {
    const clone = new AttributeState()

    clone.xmlSpace = this.xmlSpace
    clone.fill = this.fill
    clone.fillOpacity = this.fillOpacity
    // clone.fillRule = this.fillRule;
    clone.fontFamily = this.fontFamily
    clone.fontSize = this.fontSize
    clone.fontStyle = this.fontStyle
    // clone.fontVariant = this.fontVariant;
    clone.fontWeight = this.fontWeight
    clone.opacity = this.opacity
    clone.stroke = this.stroke
    clone.strokeDasharray = this.strokeDasharray
    clone.strokeDashoffset = this.strokeDashoffset
    clone.strokeLinecap = this.strokeLinecap
    clone.strokeLinejoin = this.strokeLinejoin
    clone.strokeMiterlimit = this.strokeMiterlimit
    clone.strokeOpacity = this.strokeOpacity
    clone.strokeWidth = this.strokeWidth
    // clone.textAlign = this.textAlign;
    clone.textAnchor = this.textAnchor
    clone.alignmentBaseline = this.alignmentBaseline
    clone.visibility = this.visibility
    clone.color = this.color

    return clone
  }

  static default(): AttributeState {
    const attributeState = new AttributeState()

    attributeState.xmlSpace = 'default'
    attributeState.fill = new ColorFill(new RGBColor('rgb(0, 0, 0)'))
    attributeState.fillOpacity = 1.0
    // attributeState.fillRule = "nonzero";
    attributeState.fontFamily = 'times'
    attributeState.fontSize = 16
    attributeState.fontStyle = 'normal'
    // attributeState.fontVariant = "normal";
    attributeState.fontWeight = 'normal'
    attributeState.opacity = 1.0
    attributeState.stroke = null
    attributeState.strokeDasharray = null
    attributeState.strokeDashoffset = 0
    attributeState.strokeLinecap = 'butt'
    attributeState.strokeLinejoin = 'miter'
    attributeState.strokeMiterlimit = 4.0
    attributeState.strokeOpacity = 1.0
    attributeState.strokeWidth = 1.0
    // attributeState.textAlign = "start";
    attributeState.alignmentBaseline = 'baseline'
    attributeState.textAnchor = 'start'
    attributeState.visibility = 'visible'
    attributeState.color = new ColorFill(new RGBColor('rgb(0, 0, 0)'))

    return attributeState
  }
}
