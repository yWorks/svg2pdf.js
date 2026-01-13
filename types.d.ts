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

  /**
   * Optional callback function that is called when an image fails to load.
   * If provided, this callback will be invoked with error details instead of
   * silently ignoring the error. The callback can decide how to handle the error
   * (e.g., throw an exception, log to a custom logging system, or provide fallback behavior).
   *
   * @param imageUrl - The URL of the image that failed to load
   * @param error - The error object describing what went wrong
   * @param element - The SVG image element that failed to load
   * @returns If the callback returns `true`, the error will be re-thrown to interrupt the rendering process.
   *          If it returns `false`, the error will be silently ignored and the image will be skipped.
   */
  onImageError?: (imageUrl: string, error: Error, element: Element) => boolean
}
