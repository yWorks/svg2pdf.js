import { ReferencesHandler } from './referenceshandler'
import { AttributeState } from './attributestate'
import { TextMeasure } from './textmeasure'
import { StyleSheets } from './stylesheets'
import { jsPDF, Matrix } from 'jspdf'

/**
 *
 * @package
 * @param values
 * @constructor
 * @property _pdf
 * @property attributeState  Keeps track of parent attributes that are inherited automatically
 * @property refsHandler  The handler that will render references on demand
 * @property styleSheets
 * @property textMeasure
 * @property transform The current transformation matrix
 * @property withinClipPath
 */
export class Context {
  pdf: jsPDF
  attributeState: AttributeState
  refsHandler: ReferencesHandler
  styleSheets: StyleSheets
  textMeasure: TextMeasure
  transform: Matrix
  withinClipPath: boolean

  constructor(pdf: jsPDF, values: ContextOptions = {}) {
    this.pdf = pdf

    this.attributeState = values.attributeState
      ? values.attributeState.clone()
      : AttributeState.default()
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    this.refsHandler = values.refsHandler || null
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    this.styleSheets = values.styleSheets || null
    this.textMeasure = values.textMeasure || new TextMeasure()
    this.transform = values.transform || this.pdf.unitMatrix
    this.withinClipPath = values.withinClipPath || false
  }

  clone(values: ContextOptions = {}): Context {
    values = values || {}
    const clone = new Context(this.pdf)

    clone.attributeState = values.attributeState
      ? values.attributeState.clone()
      : this.attributeState.clone()
    clone.refsHandler = values.refsHandler || this.refsHandler
    clone.styleSheets = values.styleSheets || this.styleSheets
    clone.textMeasure = values.textMeasure || this.textMeasure
    clone.transform = values.transform || this.transform
    clone.withinClipPath = values.withinClipPath || this.withinClipPath

    return clone
  }
}

export interface ContextOptions {
  attributeState?: AttributeState
  refsHandler?: ReferencesHandler,
  styleSheets? : StyleSheets
  textMeasure?: TextMeasure
  transform?: Matrix
  withinClipPath?: boolean
}
