import { jsPDF } from 'jspdf'

declare module 'svg2pdf.js' {
  /**
   * Renders an svg element to a jsPDF document.
   * For accurate results a DOM document is required (mainly used for text size measurement and image format conversion)
   * @param element The svg element, which will be cloned, so the original stays unchanged.
   * @param pdf The jsPDF object.
   * @param options An object that may contain render options.
   */
  export function svg2pdf(
    element: HTMLElement,
    pdf: jsPDF,
    options?: Svg2PdfOptions
  ): Promise<jsPDF>
}

declare module 'jspdf' {
  interface jsPDF {
    /**
     * Renders an svg element to a jsPDF document.
     * For accurate results a DOM document is required (mainly used for text size measurement and image format conversion)
     * @param element The svg element, which will be cloned, so the original stays unchanged.
     * @param options An object that may contain render options.
     */
    svg(element: HTMLElement, options?: Svg2PdfOptions): Promise<jsPDF>
  }
  interface jsPDFAPI {
    svg(this: jsPDF, element: HTMLElement, options?: Svg2PdfOptions): Promise<jsPDF>
  }
}

export interface Svg2PdfOptions {
  x?: number
  y?: number
  width?: number
  height?: number
  loadExternalStyleSheets?: boolean
}
