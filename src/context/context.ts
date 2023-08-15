import { ReferencesHandler } from './referenceshandler'
import { AttributeState } from './attributestate'
import { TextMeasure } from './textmeasure'
import { StyleSheets } from './stylesheets'
import { jsPDF, Matrix } from 'jspdf'
import { Viewport } from './viewport'

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
  svg2pdfParameters: Svg2pdfParameters
  attributeState: AttributeState
  viewport: Viewport
  refsHandler: ReferencesHandler
  styleSheets: StyleSheets
  textMeasure: TextMeasure
  transform: Matrix
  withinClipPath: boolean
  withinUse: boolean

  constructor(pdf: jsPDF, values: ContextOptions) {
    this.pdf = pdf
    this.svg2pdfParameters = values.svg2pdfParameters

    this.attributeState = values.attributeState
      ? values.attributeState.clone()
      : AttributeState.default()
    this.viewport = values.viewport
    this.refsHandler = values.refsHandler ?? null
    this.styleSheets = values.styleSheets ?? null
    this.textMeasure = values.textMeasure ?? new TextMeasure()
    this.transform = values.transform ?? this.pdf.unitMatrix
    this.withinClipPath = values.withinClipPath ?? false
    this.withinUse = values.withinUse ?? false
  }

  clone(values: Partial<ContextOptions> = {}): Context {
    return new Context(this.pdf, {
      svg2pdfParameters: values.svg2pdfParameters ?? this.svg2pdfParameters,
      attributeState: values.attributeState
        ? values.attributeState.clone()
        : this.attributeState.clone(),
      viewport: values.viewport ?? this.viewport,
      refsHandler: values.refsHandler ?? this.refsHandler,
      styleSheets: values.styleSheets ?? this.styleSheets,
      textMeasure: values.textMeasure ?? this.textMeasure,
      transform: values.transform ?? this.transform,
      withinClipPath: values.withinClipPath ?? this.withinClipPath,
      withinUse: values.withinUse ?? this.withinUse
    })
  }
}

export interface ContextOptions {
  svg2pdfParameters: Svg2pdfParameters
  viewport: Viewport
  attributeState?: AttributeState
  refsHandler: ReferencesHandler
  styleSheets: StyleSheets
  textMeasure: TextMeasure
  transform?: Matrix
  withinClipPath?: boolean
  withinUse?: boolean
}

export interface Svg2pdfParameters {
  element: Element
  x?: number
  y?: number
  width?: number
  height?: number
  loadExternalStyleSheets?: boolean
}
