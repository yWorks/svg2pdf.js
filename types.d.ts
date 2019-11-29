import { jsPDF, jsPDFAPI } from 'jspdf-yworks'

declare module 'svg2pdf.js' {
  export function svg2pdf(
    element: HTMLElement,
    pdf: jsPDF,
    options?: Svg2PdfOptions
  ): Promise<jsPDF>
}

declare module 'jspdf-yworks' {
  interface jsPDF {
    svg(element: HTMLElement, options?: Svg2PdfOptions): Promise<jsPDF>
  }
  interface jsPDFAPI {
    svg(element: HTMLElement, options?: Svg2PdfOptions): Promise<jsPDF>
  }
}

interface Svg2PdfOptions {
  scale?: number
  xOffset?: number
  yOffset?: number
}
