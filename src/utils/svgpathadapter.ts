import * as SvgPath from 'svgpath'
import { getAttribute } from './node'
import { toCubic } from './math'

export abstract class SvgPathSeg {}
export class SvgMoveTo implements SvgPathSeg {
  x: number
  y: number
  constructor(s: any) {
    this.x = s[1]
    this.y = s[2]
  }
}
export class SvgLineTo implements SvgPathSeg {
  x: number
  y: number
  constructor(s: any) {
    this.x = s[1]
    this.y = s[2]
  }
}
export class SvgCurveTo implements SvgPathSeg {
  x: number
  y: number
  x1: number
  y1: number
  x2: number
  y2: number

  constructor(s: any) {
    this.x1 = s[1]
    this.y1 = s[2]
    this.x2 = s[3]
    this.y2 = s[4]
    this.x = s[5]
    this.y = s[6]
  }
}

export class SvgClose implements SvgPathSeg {}

// pathSegList is marked deprecated in chrome, so parse the d attribute manually if necessary
export class SvgPathAdapter {
  private path: any
  private transformString: string
  private list: SvgPathSeg[]

  constructor(node: HTMLElement) {
    this.path = SvgPath(getAttribute(node, 'd') || '')
      .unshort()
      .unarc()
      .abs()
    this.unshort()
  }

  private createSegment(s: any) {
    return s
      ? s[0] === 'M'
        ? new SvgMoveTo(s)
        : s[0] === 'L'
        ? new SvgLineTo(s)
        : s[0] === 'C'
        ? new SvgCurveTo(s)
        : s[0] === 'Z'
        ? new SvgClose()
        : s
      : s
  }

  getSegments(transformString?: string): SvgPathSeg[] {
    let list = this.list || []
    this.transform(transformString).iterate((s: any, i: any) => {
      let seg = this.createSegment(s)
      list.length > i ? list[i] !== seg && (list[i] = seg) : list.push(seg)
    })
    return list
  }

  private transform(transformString: string): any {
    if (transformString && transformString.length > 0 && transformString !== this.transformString) {
      this.transformString = transformString
      const clone = this.path
      return SvgPath(clone.transform(transformString).toString())
    } else {
      return this.path
    }
  }

  iterate(fn: Function): void {
    let publicI = 0,
      prevSeg: any[] = null,
      currSeg: any[] = null,
      nextSeg: any[] = null,
      res: any[]
    this.path.iterate((segment: any, i: any) => {
      if (publicI === i) {
        nextSeg = segment
      } else if (i === publicI + 1) {
        currSeg = nextSeg
        nextSeg = segment
        res = fn(
          {
            current: this.createSegment(currSeg),
            previous: this.createSegment(prevSeg),
            next: this.createSegment(nextSeg)
          },
          publicI
        )
        prevSeg = res || currSeg
        publicI++
      }
    })
    fn(
      {
        current: this.createSegment(nextSeg),
        previous: this.createSegment(prevSeg),
        next: null
      },
      publicI
    )
  }

  private unshort() {
    this.iterate((chainStack: any, i: number) => {
      let seg = chainStack.current
      if (seg && !(seg instanceof SvgPathSeg)) {
        if (seg[0] === 'H') {
          return (this.path.segments[i] = ['L', seg[1], chainStack.previous.y])
        } else if (seg[0] === 'V') {
          return (this.path.segments[i] = ['L', chainStack.previous.x, seg[1]])
        } else if (seg[0] === 'Q') {
          const p2 = toCubic([chainStack.previous.x, chainStack.previous.y], [seg[1], seg[2]]),
            p3 = toCubic([seg[3], seg[4]], [seg[1], seg[2]])
          return (this.path.segments[i] = ['C', p2[0], p2[1], p3[0], p3[1], seg[3], seg[4]])
        }
      }
    })
  }
}
