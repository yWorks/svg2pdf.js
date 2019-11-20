import * as SvgPath from 'svgpath'
import { getAttribute } from './node'
import { pathCommandCoordinatesMap } from './constants'

export class PathSegment implements PathSeg {
  pathSegTypeAsLetter: string
  constructor(segment: any[]) {
    this.pathSegTypeAsLetter = segment[0]
    for (let i = 1; i < segment.length; i++) {
      Object.defineProperty(this, pathCommandCoordinatesMap[this.pathSegTypeAsLetter][i - 1], {
        get: () => {
          return segment[i]
        }
      })
    }
  }
}

export interface PathSeg {
  pathSegTypeAsLetter: string
  x?: number
  y?: number
  x1?: number
  y1?: number
  x2?: number
  y2?: number
}

// pathSegList is marked deprecated in chrome, so parse the d attribute manually if necessary
export class Path {
  private path: any
  private transformString: string
  private list: PathSeg[]

  constructor(node: HTMLElement) {
    this.path = SvgPath(getAttribute(node, 'd') || '')
      .unshort()
      .unarc()
      .abs()
  }

  getSegments(transformString?: string): PathSeg[] {
    let list = this.list || []
    this.transform(transformString).iterate((s: any, i: any) => {
      let seg = new PathSegment(s)
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
      prevSeg: PathSeg = null,
      currSeg: PathSeg,
      nextSeg: PathSeg
    this.path.iterate((segment: any, i: any) => {
      if (publicI === i) {
        nextSeg = new PathSegment(segment)
      } else if (i === publicI + 1) {
        currSeg = nextSeg
        nextSeg = new PathSegment(segment)
        fn({ current: currSeg, previous: prevSeg, next: nextSeg })
        prevSeg = currSeg
        publicI++
      }
    })
  }
}
