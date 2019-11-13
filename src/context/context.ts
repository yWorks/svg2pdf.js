/**
 *
 * @param {object} values
 * @constructor
 * @property {AttributeState} attributeState  Keeps track of parent attributes that are inherited automatically
 * @property {ReferencesHandler} refsHandler  The handler that will render references on demand
 * @property {jspdf.Matrix} transform The current transformation matrix
 * @property {boolean} withinClipPath
 * @property {boolean} withinDefs True if we are top-level within a defs node, so the target can be switched to an pdf form object
 */
import ReferencesHandler from './referenceshandler'
import AttributeState from './attributestate'
import TextMeasure from './textmeasure'

export default class Context {
  _pdf: any
  attributeState: AttributeState
  refsHandler: ReferencesHandler
  textMeasure: TextMeasure
  transform: any
  withinClipPath: boolean

  constructor(pdf: any, values?: { [key: string]: any }) {
    values = values || {}
    this._pdf = pdf

    this.attributeState = values.attributeState
      ? values.attributeState.clone()
      : AttributeState.default()
    this.refsHandler = values.refsHandler || null
    this.textMeasure = values.textMeasure || new TextMeasure()
    this.transform = values.transform || this._pdf.unitMatrix
    this.withinClipPath = values.withinClipPath || false
  }

  clone(values?: { [key: string]: any }) {
    values = values || {}
    var clone = new Context(this._pdf)

    clone.attributeState = values.attributeState
      ? values.attributeState.clone()
      : this.attributeState.clone()
    clone.refsHandler = values.refsHandler || this.refsHandler
    clone.textMeasure = values.textMeasure || this.textMeasure
    clone.transform = values.transform || this.transform
    clone.withinClipPath = values.withinClipPath || this.withinClipPath

    return clone
  }
}
