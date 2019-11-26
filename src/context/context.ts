import { ReferencesHandler } from './referenceshandler'
import { AttributeState } from './attributestate'
import { TextMeasure } from './textmeasure'

/**
 *
 * @package
 * @param values
 * @constructor
 * @property _pdf
 * @property attributeState  Keeps track of parent attributes that are inherited automatically
 * @property refsHandler  The handler that will render references on demand
 * @property textMeasure
 * @property transform The current transformation matrix
 * @property withinClipPath
 */
export class Context {
  pdf: any
  attributeState: AttributeState
  refsHandler: ReferencesHandler
  textMeasure: TextMeasure
  transform: any
  withinClipPath: boolean

  constructor(pdf: any, values: IContextOptions = {}) {
    this.pdf = pdf

    this.attributeState = values.attributeState
      ? values.attributeState.clone()
      : AttributeState.default()
    this.refsHandler = values.refsHandler || null
    this.textMeasure = values.textMeasure || new TextMeasure()
    this.transform = values.transform || this.pdf.unitMatrix
    this.withinClipPath = values.withinClipPath || false
  }

  clone(values: IContextOptions = {}) {
    values = values || {}
    const clone = new Context(this.pdf)

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

export interface IContextOptions {
  pdf?: any
  attributeState?: AttributeState
  refsHandler?: ReferencesHandler
  textMeasure?: TextMeasure
  transform?: any
  withinClipPath?: boolean
}
