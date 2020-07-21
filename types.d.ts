import { jsPDF } from 'jspdf'

declare module 'svg2pdf.js' {
  /**
   * Renders an svg element to the current page of a jsPDF document.
   * @param element The svg element.
   * @param pdf The jsPDF document.
   * @param options Optional options object.
   * @return A promise resolving to the jsPDF document.
   */
  export function svg2pdf(element: Element, pdf: jsPDF, options?: Svg2pdfOptions): Promise<jsPDF>
}

declare module 'jspdf' {
  interface jsPDF {
    /**
     * Renders an svg element to the current page of a jsPDF document.
     * @param element The svg element.
     * @param options Optional options object.
     * @return A promise resolving to the jsPDF document.
     */
    svg(element: Element, options?: Svg2pdfOptions): Promise<jsPDF>
  }

  interface jsPDFAPI {
    /**
     * Renders an svg element to the current page of a jsPDF document.
     * @param element The svg element.
     * @param options Optional options object.
     * @return A promise resolving to the jsPDF document.
     */
    svg(this: jsPDF, element: Element, options?: Svg2pdfOptions): Promise<jsPDF>
  }
}

/**
 * Optional options that can be passed to {@link svg2pdf}.
 */
export interface Svg2pdfOptions {
  /**
   * The horizontal offset at which the SVG shall be rendered. The default is 0.
   */
  x?: number

  /**
   * The vertical offset at which the SVG shall be rendered. The default is 0.
   */
  y?: number

  /**
   * The desired width of the rendered SVG. Defines the initial viewport for
   * the outermost SVG element. The {@link width} and {@link height} properties
   * behave exactly like the width and height attributes on an HTML img element
   * with an SVG image as source.
   */
  width?: number

  /**
   * The desired height of the rendered SVG. See {@link width}.
   */
  height?: number

  /**
   * Whether external style sheets referenced by SVG link elements or
   * xml-stylesheets shall be loaded using HTTP requests.
   * Note, that all style sheets that cannot be accessed because of CORS
   * policies are ignored. The default is false.
   */
  loadExternalStyleSheets?: boolean
}
