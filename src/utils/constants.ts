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

export const fontAliases: { [key: string]: string } = {
  'sans-serif': 'helvetica',
  verdana: 'helvetica',
  arial: 'helvetica',

  fixed: 'courier',
  monospace: 'courier',
  terminal: 'courier',

  serif: 'times',
  cursive: 'times',
  fantasy: 'times'
}

export const cToQ = 2 / 3 // ratio to convert quadratic bezier curves to cubic ones

// groups: 1: mime-type (+ charset), 2: mime-type (w/o charset), 3: charset, 4: base64?, 5: body
export const dataUrlRegex = /^\s*data:(([^/,;]+\/[^/,;]+)(?:;([^,;=]+=[^,;=]+))?)?(?:;(base64))?,(.*\s*)$/i

export const svgNamespaceURI = 'http://www.w3.org/2000/svg'

export const pathCommandCoordinatesMap: { [type: string]: string[] } = {
  M: ['x', 'y'],

  L: ['x', 'y'],
  H: ['x'],
  V: ['y'],

  C: ['x1', 'y1', 'x2', 'y2', 'x', 'y'],
  Q: ['x1', 'y1', 'x', 'y']
}
