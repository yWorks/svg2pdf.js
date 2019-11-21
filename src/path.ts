export class Path {
  segments: Segment[]

  constructor() {
    this.segments = []
  }

  moveTo(x: number, y: number) {
    this.segments.push(new MoveTo(x, y))
    return this
  }
  lineTo(x: number, y: number) {
    this.segments.push(new LineTo(x, y))
    return this
  }
  curveTo(x1: number, y1: number, x2: number, y2: number, x: number, y: number) {
    this.segments.push(new CurveTo(x1, y1, x2, y2, x, y))
    return this
  }
  close() {
    this.segments.push(new Close())
    return this
  }
  toPdfPath() {
    const out: any[] = []
    this.segments.forEach(s => {
      out.push(
        s instanceof MoveTo
          ? { op: 'm', c: [s.x, s.y] }
          : s instanceof LineTo
          ? { op: 'l', c: [s.x, s.y] }
          : s instanceof CurveTo
          ? { op: 'c', c: [s.x1, s.y1, s.x2, s.y2, s.x, s.y] }
          : { op: 'h' }
      )
    })
    return out
  }
}

export abstract class Segment {}

export class MoveTo implements Segment {
  x: number
  y: number
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
}

export class LineTo implements Segment {
  x: number
  y: number
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
}

export class CurveTo implements Segment {
  x1: number
  y1: number
  x2: number
  y2: number
  x: number
  y: number
  constructor(x1: number, y1: number, x2: number, y2: number, x: number, y: number) {
    this.x1 = x1
    this.y1 = y1
    this.x2 = x2
    this.y2 = y2
    this.x = x
    this.y = y
  }
}

export class Close implements Segment {}
