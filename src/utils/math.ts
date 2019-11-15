import { cToQ } from './constants'

export function getAngle(from: number[], to: number[]) {
  return Math.atan2(to[1] - from[1], to[0] - from[0])
}

// parses a comma, sign and/or whitespace separated string of floats and returns the single floats in an array
export function parseFloats(str: string) {
  let floats = [],
    match,
    regex = /[+-]?(?:(?:\d+\.?\d*)|(?:\d*\.?\d+))(?:[eE][+-]?\d+)?/g
  while ((match = regex.exec(str))) {
    floats.push(parseFloat(match[0]))
  }
  return floats
}

// transforms a cubic bezier control point to a quadratic one: returns from + (2/3) * (to - from)
export function toCubic(from: number[], to: number[]) {
  return [cToQ * (to[0] - from[0]) + from[0], cToQ * (to[1] - from[1]) + from[1]]
}

// mirrors p1 at p2
export function mirrorPoint(p1: number[], p2: number[]) {
  const dx = p2[0] - p1[0]
  const dy = p2[1] - p1[1]

  return [p1[0] + 2 * dx, p1[1] + 2 * dy]
}

export function normalize(v: number[]) {
  const length = Math.sqrt(v[0] * v[0] + v[1] * v[1])
  return [v[0] / length, v[1] / length]
}

export function getDirectionVector(from: number[], to: number[]) {
  const v = [to[0] - from[0], to[1] - from[1]]
  return normalize(v)
}

export function addVectors(v1: number[], v2: number[]) {
  return [v1[0] + v2[0], v1[1] + v2[1]]
}

// multiplies a vector with a matrix: vec' = vec * matrix
export function multVecMatrix(vec: number[], matrix: any) {
  const x = vec[0]
  const y = vec[1]
  return [matrix.a * x + matrix.c * y + matrix.e, matrix.b * x + matrix.d * y + matrix.f]
}
