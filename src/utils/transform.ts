import Context from '../context/context'
import { nodeIs, getAttribute } from './node'
import { parseFloats } from './math'

export function computeViewBoxTransform(
  node: HTMLElement,
  viewBox: number[],
  eX: number,
  eY: number,
  eWidth: number,
  eHeight: number,
  context: Context
) {
  var vbX = viewBox[0]
  var vbY = viewBox[1]
  var vbWidth = viewBox[2]
  var vbHeight = viewBox[3]

  var scaleX = eWidth / vbWidth
  var scaleY = eHeight / vbHeight

  var align, meetOrSlice
  var preserveAspectRatio = node.getAttribute('preserveAspectRatio')
  if (preserveAspectRatio) {
    var alignAndMeetOrSlice = preserveAspectRatio.split(' ')
    if (alignAndMeetOrSlice[0] === 'defer') {
      alignAndMeetOrSlice = alignAndMeetOrSlice.slice(1)
    }

    align = alignAndMeetOrSlice[0]
    meetOrSlice = alignAndMeetOrSlice[1] || 'meet'
  } else {
    align = 'xMidYMid'
    meetOrSlice = 'meet'
  }

  if (align !== 'none') {
    if (meetOrSlice === 'meet') {
      // uniform scaling with min scale
      scaleX = scaleY = Math.min(scaleX, scaleY)
    } else if (meetOrSlice === 'slice') {
      // uniform scaling with max scale
      scaleX = scaleY = Math.max(scaleX, scaleY)
    }
  }

  var translateX = eX - vbX * scaleX
  var translateY = eY - vbY * scaleY

  if (align.indexOf('xMid') >= 0) {
    translateX += (eWidth - vbWidth * scaleX) / 2
  } else if (align.indexOf('xMax') >= 0) {
    translateX += eWidth - vbWidth * scaleX
  }

  if (align.indexOf('yMid') >= 0) {
    translateY += (eHeight - vbHeight * scaleY) / 2
  } else if (align.indexOf('yMax') >= 0) {
    translateY += eHeight - vbHeight * scaleY
  }

  var translate = new context._pdf.Matrix(1, 0, 0, 1, translateX, translateY)
  var scale = new context._pdf.Matrix(scaleX, 0, 0, scaleY, 0, 0)

  return context._pdf.matrixMult(scale, translate)
}

// computes the transform directly applied at the node (such as viewbox scaling and the "transform" atrribute)
// x,y,cx,cy,r,... are omitted
export function computeNodeTransform(node: HTMLElement, context: Context) {
  var viewBox, x, y
  var nodeTransform = context._pdf.unitMatrix
  if (nodeIs(node, 'svg,g')) {
    x = parseFloat(getAttribute(node, 'x')) || 0
    y = parseFloat(getAttribute(node, 'y')) || 0

    viewBox = node.getAttribute('viewBox')
    if (viewBox) {
      var box = parseFloats(viewBox)
      var width = parseFloat(getAttribute(node, 'width')) || box[2]
      var height = parseFloat(getAttribute(node, 'height')) || box[3]
      nodeTransform = computeViewBoxTransform(node, box, x, y, width, height, context)
    } else {
      nodeTransform = new context._pdf.Matrix(1, 0, 0, 1, x, y)
    }
  } else if (nodeIs(node, 'marker')) {
    x = parseFloat(node.getAttribute('refX')) || 0
    y = parseFloat(node.getAttribute('refY')) || 0

    viewBox = node.getAttribute('viewBox')
    if (viewBox) {
      var bounds = parseFloats(viewBox)
      bounds[0] = bounds[1] = 0 // for some reason vbX anc vbY seem to be ignored for markers
      nodeTransform = computeViewBoxTransform(
        node,
        bounds,
        0,
        0,
        parseFloat(node.getAttribute('markerWidth')) || 3,
        parseFloat(node.getAttribute('markerHeight')) || 3,
        context
      )
      nodeTransform = context._pdf.matrixMult(
        new context._pdf.Matrix(1, 0, 0, 1, -x, -y),
        nodeTransform
      )
    } else {
      nodeTransform = new context._pdf.Matrix(1, 0, 0, 1, -x, -y)
    }
  }

  var transformString = getAttribute(node, 'transform')
  if (!transformString) return nodeTransform
  else return context._pdf.matrixMult(nodeTransform, parseTransform(transformString, context))
}

// parses the "transform" string
export function parseTransform(transformString: string, context: Context) {
  if (!transformString || transformString === 'none') return context._pdf.unitMatrix

  var mRegex = /^[\s,]*matrix\(([^\)]+)\)\s*/,
    tRegex = /^[\s,]*translate\(([^\)]+)\)\s*/,
    rRegex = /^[\s,]*rotate\(([^\)]+)\)\s*/,
    sRegex = /^[\s,]*scale\(([^\)]+)\)\s*/,
    sXRegex = /^[\s,]*skewX\(([^\)]+)\)\s*/,
    sYRegex = /^[\s,]*skewY\(([^\)]+)\)\s*/

  var resultMatrix = context._pdf.unitMatrix,
    m

  var tSLength
  while (transformString.length > 0 && transformString.length !== tSLength) {
    tSLength = transformString.length

    var match = mRegex.exec(transformString)
    if (match) {
      m = parseFloats(match[1])
      resultMatrix = context._pdf.matrixMult(
        new context._pdf.Matrix(m[0], m[1], m[2], m[3], m[4], m[5]),
        resultMatrix
      )
      transformString = transformString.substr(match[0].length)
    }
    match = rRegex.exec(transformString)
    if (match) {
      m = parseFloats(match[1])
      var a = (Math.PI * m[0]) / 180
      resultMatrix = context._pdf.matrixMult(
        new context._pdf.Matrix(Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0),
        resultMatrix
      )
      if (m[1] && m[2]) {
        var t1 = new context._pdf.Matrix(1, 0, 0, 1, m[1], m[2])
        var t2 = new context._pdf.Matrix(1, 0, 0, 1, -m[1], -m[2])
        resultMatrix = context._pdf.matrixMult(t2, context._pdf.matrixMult(resultMatrix, t1))
      }
      transformString = transformString.substr(match[0].length)
    }
    match = tRegex.exec(transformString)
    if (match) {
      m = parseFloats(match[1])
      resultMatrix = context._pdf.matrixMult(
        new context._pdf.Matrix(1, 0, 0, 1, m[0], m[1] || 0),
        resultMatrix
      )
      transformString = transformString.substr(match[0].length)
    }
    match = sRegex.exec(transformString)
    if (match) {
      m = parseFloats(match[1])
      if (!m[1]) m[1] = m[0]
      resultMatrix = context._pdf.matrixMult(
        new context._pdf.Matrix(m[0], 0, 0, m[1], 0, 0),
        resultMatrix
      )
      transformString = transformString.substr(match[0].length)
    }
    match = sXRegex.exec(transformString)
    if (match) {
      m = parseFloat(match[1])
      m *= Math.PI / 180
      resultMatrix = context._pdf.matrixMult(
        new context._pdf.Matrix(1, 0, Math.tan(m), 1, 0, 0),
        resultMatrix
      )
      transformString = transformString.substr(match[0].length)
    }
    match = sYRegex.exec(transformString)
    if (match) {
      m = parseFloat(match[1])
      m *= Math.PI / 180
      resultMatrix = context._pdf.matrixMult(
        new context._pdf.Matrix(1, Math.tan(m), 0, 1, 0, 0),
        resultMatrix
      )
      transformString = transformString.substr(match[0].length)
    }
  }
  return resultMatrix
}
