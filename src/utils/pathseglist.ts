import { parseFloats } from './math'
import * as SvgPath from 'svgpath'
import { getAttribute } from './node'

interface PathSeg {
  pathSegTypeAsLetter: string
  x?: number
  y?: number
  x1?: number
  y1?: number
  x2?: number
  y2?: number
}

// pathSegList is marked deprecated in chrome, so parse the d attribute manually if necessary
export default class PathSegList {
  static get(node: HTMLElement): any {
    var d = getAttribute(node, 'd')

    if (!d) {
      return []
    }

    // Replace arcs before path segment list is handled
    if (SvgPath) {
      d = SvgPath(d)
        .unshort()
        .unarc()
        .abs()
        .toString()
      node.setAttribute('d', d)
    }

    var pathSegList = (node as any).pathSegList

    if (pathSegList) {
      return pathSegList
    }

    pathSegList = []

    var regex = /([a-df-zA-DF-Z])([^a-df-zA-DF-Z]*)/g,
      match
    while ((match = regex.exec(d))) {
      var coords = parseFloats(match[2])

      var type = match[1]
      var length =
        'zZ'.indexOf(type) >= 0
          ? 0
          : 'hHvV'.indexOf(type) >= 0
          ? 1
          : 'mMlLtT'.indexOf(type) >= 0
          ? 2
          : 'sSqQ'.indexOf(type) >= 0
          ? 4
          : 'aA'.indexOf(type) >= 0
          ? 7
          : 'cC'.indexOf(type) >= 0
          ? 6
          : -1

      var i = 0
      do {
        var pathSeg: PathSeg = { pathSegTypeAsLetter: type }
        switch (type) {
          case 'h':
          case 'H':
            pathSeg.x = coords[i]
            break

          case 'v':
          case 'V':
            pathSeg.y = coords[i]
            break

          case 'c':
          case 'C':
            pathSeg.x1 = coords[i + length - 6]
            pathSeg.y1 = coords[i + length - 5]
          case 's':
          case 'S':
            pathSeg.x2 = coords[i + length - 4]
            pathSeg.y2 = coords[i + length - 3]
          case 't':
          case 'T':
          case 'l':
          case 'L':
          case 'm':
          case 'M':
            pathSeg.x = coords[i + length - 2]
            pathSeg.y = coords[i + length - 1]
            break

          case 'q':
          case 'Q':
            pathSeg.x1 = coords[i]
            pathSeg.y1 = coords[i + 1]
            pathSeg.x = coords[i + 2]
            pathSeg.y = coords[i + 3]
            break
          case 'a':
          case 'A':
            throw new Error('Cannot convert Arcs without SvgPath package')
        }

        pathSegList.push(pathSeg)

        // "If a moveto is followed by multiple pairs of coordinates, the subsequent pairs are treated as implicit
        // lineto commands"
        if (type === 'm') {
          type = 'l'
        } else if (type === 'M') {
          type = 'L'
        }

        i += length
      } while (i < coords.length)
    }

    pathSegList.getItem = function(i: number) {
      return this[i]
    }
    pathSegList.numberOfItems = pathSegList.length

    return pathSegList
  }
}
