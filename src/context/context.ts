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
 * @property pdf
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

  constructor(pdf: jsPDF, values: ContextOptions) {
    this.pdf = pdf

    this.attributeState = values.attributeState
      ? values.attributeState.clone()
      : AttributeState.default()
    this.refsHandler = values.refsHandler ?? null
    this.styleSheets = values.styleSheets ?? null
    this.textMeasure = values.textMeasure ?? new TextMeasure()
    this.transform = values.transform ?? this.pdf.unitMatrix
    this.withinClipPath = values.withinClipPath ?? false
  }

  clone(values: Partial<ContextOptions> = {}): Context {
    return new Context(this.pdf, {
      attributeState: values.attributeState
        ? values.attributeState.clone()
        : this.attributeState.clone(),
      refsHandler: values.refsHandler ?? this.refsHandler,
      styleSheets: values.styleSheets ?? this.styleSheets,
      textMeasure: values.textMeasure ?? this.textMeasure,
      transform: values.transform ?? this.transform,
      withinClipPath: values.withinClipPath ?? this.withinClipPath
    })
  }
}

export interface ContextOptions {
  attributeState?: AttributeState
  refsHandler: ReferencesHandler
  styleSheets: StyleSheets
  textMeasure?: TextMeasure
  transform?: Matrix
  withinClipPath?: boolean
}
