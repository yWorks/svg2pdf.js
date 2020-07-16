import { Context } from '../context/context'
import { parseFloats } from './parsing'
import { Matrix } from 'jspdf'

export function computeViewBoxTransform(
  node: HTMLElement,
  viewBox: number[],
  eX: number,
  eY: number,
  eWidth: number,
  eHeight: number,
  context: Context
): any {
  const vbX = viewBox[0]
  const vbY = viewBox[1]
  const vbWidth = viewBox[2]
  const vbHeight = viewBox[3]

  let scaleX = eWidth / vbWidth
  let scaleY = eHeight / vbHeight

  let align, meetOrSlice
  const preserveAspectRatio = node.getAttribute('preserveAspectRatio')
  if (preserveAspectRatio) {
    let alignAndMeetOrSlice = preserveAspectRatio.split(' ')
    if (alignAndMeetOrSlice[0] === 'defer') {
      alignAndMeetOrSlice = alignAndMeetOrSlice.slice(1)
    }

    align = alignAndMeetOrSlice[0]
    meetOrSlice = alignAndMeetOrSlice[1] || 'meet'
  } else {
    align = 'xMidyMid'
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

  let translateX = eX - vbX * scaleX
  let translateY = eY - vbY * scaleY

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

  const translate = context.pdf.Matrix(1, 0, 0, 1, translateX, translateY)
  const scale = context.pdf.Matrix(scaleX, 0, 0, scaleY, 0, 0)

  return context.pdf.matrixMult(scale, translate)
}

// parses the "transform" string
export function parseTransform(
  transformString: string | undefined | null,
  context: Context
): Matrix {
  if (!transformString || transformString === 'none') return context.pdf.unitMatrix

  const mRegex = /^[\s,]*matrix\(([^\)]+)\)\s*/,
    tRegex = /^[\s,]*translate\(([^\)]+)\)\s*/,
    rRegex = /^[\s,]*rotate\(([^\)]+)\)\s*/,
    sRegex = /^[\s,]*scale\(([^\)]+)\)\s*/,
    sXRegex = /^[\s,]*skewX\(([^\)]+)\)\s*/,
    sYRegex = /^[\s,]*skewY\(([^\)]+)\)\s*/

  let resultMatrix = context.pdf.unitMatrix
  let m

  let tSLength
  while (transformString.length > 0 && transformString.length !== tSLength) {
    tSLength = transformString.length

    let match = mRegex.exec(transformString)
    if (match) {
      m = parseFloats(match[1])
      resultMatrix = context.pdf.matrixMult(
        context.pdf.Matrix(m[0], m[1], m[2], m[3], m[4], m[5]),
        resultMatrix
      )
      transformString = transformString.substr(match[0].length)
    }
    match = rRegex.exec(transformString)
    if (match) {
      m = parseFloats(match[1])
      const a = (Math.PI * m[0]) / 180
      resultMatrix = context.pdf.matrixMult(
        context.pdf.Matrix(Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0),
        resultMatrix
      )
      if (m[1] && m[2]) {
        const t1 = context.pdf.Matrix(1, 0, 0, 1, m[1], m[2])
        const t2 = context.pdf.Matrix(1, 0, 0, 1, -m[1], -m[2])
        resultMatrix = context.pdf.matrixMult(t2, context.pdf.matrixMult(resultMatrix, t1))
      }
      transformString = transformString.substr(match[0].length)
    }
    match = tRegex.exec(transformString)
    if (match) {
      m = parseFloats(match[1])
      resultMatrix = context.pdf.matrixMult(
        context.pdf.Matrix(1, 0, 0, 1, m[0], m[1] || 0),
        resultMatrix
      )
      transformString = transformString.substr(match[0].length)
    }
    match = sRegex.exec(transformString)
    if (match) {
      m = parseFloats(match[1])
      if (!m[1]) m[1] = m[0]
      resultMatrix = context.pdf.matrixMult(
        context.pdf.Matrix(m[0], 0, 0, m[1], 0, 0),
        resultMatrix
      )
      transformString = transformString.substr(match[0].length)
    }
    match = sXRegex.exec(transformString)
    if (match) {
      m = parseFloat(match[1])
      m *= Math.PI / 180
      resultMatrix = context.pdf.matrixMult(
        context.pdf.Matrix(1, 0, Math.tan(m), 1, 0, 0),
        resultMatrix
      )
      transformString = transformString.substr(match[0].length)
    }
    match = sYRegex.exec(transformString)
    if (match) {
      m = parseFloat(match[1])
      m *= Math.PI / 180
      resultMatrix = context.pdf.matrixMult(
        context.pdf.Matrix(1, Math.tan(m), 0, 1, 0, 0),
        resultMatrix
      )
      transformString = transformString.substr(match[0].length)
    }
  }
  return resultMatrix
}
