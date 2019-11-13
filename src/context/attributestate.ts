import RGBColor from '../utils/rgbcolor'

export default class AttributeState {
  public xmlSpace: string
  public color: any
  public fill: any
  public fillOpacity: number
  // public fillRule: string
  public fontFamily: string
  public fontSize: any
  public fontStyle: string
  // public fontVariant: string
  public fontWeight: string
  public opacity: number
  public stroke: any
  public strokeDasharray: []
  public strokeDashoffset: number
  public strokeLinecap: string
  public strokeLinejoin: string
  public strokeMiterlimit: number
  public strokeOpacity: number
  public strokeWidth: number
  // public textAlign: string
  public alignmentBaseline: string
  public textAnchor: string
  public visibility: string

  constructor() {
    this.xmlSpace = null
    this.color = null
    this.fill = null
    this.fillOpacity = 1.0
    // this.fillRule = null;
    this.fontFamily = null
    this.fontSize = 16
    this.fontStyle = null
    // this.fontVariant = null;
    this.fontWeight = null
    this.opacity = 1.0
    this.stroke = null
    this.strokeDasharray = null
    this.strokeDashoffset = null
    this.strokeLinecap = null
    this.strokeLinejoin = null
    this.strokeMiterlimit = 4.0
    this.strokeOpacity = 1.0
    this.strokeWidth = 1.0
    // this.textAlign = null;
    this.alignmentBaseline = null
    this.textAnchor = null
    this.visibility = null
  }

  clone() {
    var clone = new AttributeState()

    clone.xmlSpace = this.xmlSpace
    clone.color = this.color
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

    return clone
  }

  static default() {
    var attributeState = new AttributeState()

    attributeState.xmlSpace = 'default'
    attributeState.fill = new RGBColor('rgb(0, 0, 0)')
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
    attributeState.strokeDashoffset = null
    attributeState.strokeLinecap = 'butt'
    attributeState.strokeLinejoin = 'miter'
    attributeState.strokeMiterlimit = 4.0
    attributeState.strokeOpacity = 1.0
    attributeState.strokeWidth = 1.0
    // attributeState.textAlign = "start";
    attributeState.alignmentBaseline = 'baseline'
    attributeState.textAnchor = 'start'
    attributeState.visibility = 'visible'

    return attributeState
  }
}
