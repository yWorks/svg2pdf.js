export const iriReference = /url\(["']?#([^"']+)["']?\)/

export const alignmentBaselineMap: { [key: string]: string } = {
  bottom: 'bottom',
  'text-bottom': 'bottom',
  top: 'top',
  'text-top': 'top',
  hanging: 'hanging',
  middle: 'middle',
  central: 'middle',
  center: 'middle',
  mathematical: 'middle',
  ideographic: 'ideographic',
  alphabetic: 'alphabetic',
  baseline: 'alphabetic'
}

export const svgNamespaceURI = 'http://www.w3.org/2000/svg'
