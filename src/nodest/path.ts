import NodeStructureTree from './nst'
import Context from '../context/context'
import PathSegList from '../utils/pathseglist'
import { addLineWidth } from '../utils/bbox'
import {
  toCubic,
  getAngle,
  getDirectionVector,
  normalize,
  addVectors,
  multVecMatrix
} from '../utils/math'
import { iriReference } from '../utils/constants'
import MarkerList from '../markerlist'
import Marker from '../marker'
import { getAttribute } from '../utils/node'
import { getControlPointFromPrevious } from '../utils/misc'

export default class Path extends NodeStructureTree {
  renderCore(context: Context): void {
    if (!context.withinClipPath) {
      context._pdf.setCurrentTransformationMatrix(context.transform)
    }
    var list = PathSegList.get(this.element)
    var markerEnd = getAttribute(this.element, 'marker-end'),
      markerStart = getAttribute(this.element, 'marker-start'),
      markerMid = getAttribute(this.element, 'marker-mid')

    markerEnd && (markerEnd = iriReference.exec(markerEnd)[1])
    markerStart && (markerStart = iriReference.exec(markerStart)[1])
    markerMid && (markerMid = iriReference.exec(markerMid)[1])

    var getLinesFromPath = function() {
      var x = 0,
        y = 0
      var x0 = x,
        y0 = y
      var prevX, prevY, newX, newY
      var to, p, p2, p3
      var lines = []
      var markers = new MarkerList()
      var op
      var prevAngle = [0, 0],
        curAngle

      for (var i = 0; i < list.numberOfItems; i++) {
        var seg = list.getItem(i)
        var cmd = seg.pathSegTypeAsLetter
        switch (cmd) {
          case 'M':
            x0 = x
            y0 = y
            to = [seg.x, seg.y]
            op = 'm'
            break
          case 'm':
            x0 = x
            y0 = y
            to = [seg.x + x, seg.y + y]
            op = 'm'
            break
          case 'L':
            to = [seg.x, seg.y]
            op = 'l'
            break
          case 'l':
            to = [seg.x + x, seg.y + y]
            op = 'l'
            break
          case 'H':
            to = [seg.x, y]
            op = 'l'
            newX = seg.x
            newY = y
            break
          case 'h':
            to = [seg.x + x, y]
            op = 'l'
            newX = seg.x + x
            newY = y
            break
          case 'V':
            to = [x, seg.y]
            op = 'l'
            newX = x
            newY = seg.y
            break
          case 'v':
            to = [x, seg.y + y]
            op = 'l'
            newX = x
            newY = seg.y + y
            break
          case 'C':
            p2 = [seg.x1, seg.y1]
            p3 = [seg.x2, seg.y2]
            to = [seg.x, seg.y]
            break
          case 'c':
            p2 = [seg.x1 + x, seg.y1 + y]
            p3 = [seg.x2 + x, seg.y2 + y]
            to = [seg.x + x, seg.y + y]
            break
          case 'S':
            p2 = getControlPointFromPrevious(i, [x, y], list, prevX, prevY)
            p3 = [seg.x2, seg.y2]
            to = [seg.x, seg.y]
            break
          case 's':
            p2 = getControlPointFromPrevious(i, [x, y], list, prevX, prevY)
            p3 = [seg.x2 + x, seg.y2 + y]
            to = [seg.x + x, seg.y + y]
            break
          case 'Q':
            p = [seg.x1, seg.y1]
            p2 = toCubic([x, y], p)
            p3 = toCubic([seg.x, seg.y], p)
            to = [seg.x, seg.y]
            break
          case 'q':
            p = [seg.x1 + x, seg.y1 + y]
            p2 = toCubic([x, y], p)
            p3 = toCubic([x + seg.x, y + seg.y], p)
            to = [seg.x + x, seg.y + y]
            break
          case 'T':
            p = getControlPointFromPrevious(i, [x, y], list, prevX, prevY)
            p2 = toCubic([x, y], p)
            p3 = toCubic([seg.x, seg.y], p)
            to = [seg.x, seg.y]
            break
          case 't':
            p = getControlPointFromPrevious(i, [x, y], list, prevX, prevY)
            p2 = toCubic([x, y], p)
            p3 = toCubic([x + seg.x, y + seg.y], p)
            to = [seg.x + x, seg.y + y]
            break
          // TODO: A,a
          case 'Z':
          case 'z':
            x = x0
            y = y0
            lines.push({ op: 'h' })
            break
        }

        var hasStartMarker =
          markerStart &&
          (i === 1 ||
            ('mM'.indexOf(cmd) < 0 && 'mM'.indexOf(list.getItem(i - 1).pathSegTypeAsLetter) >= 0))
        var hasEndMarker =
          markerEnd &&
          (i === list.numberOfItems - 1 ||
            ('mM'.indexOf(cmd) < 0 && 'mM'.indexOf(list.getItem(i + 1).pathSegTypeAsLetter) >= 0))
        var hasMidMarker =
          markerMid &&
          i > 0 &&
          !(i === 1 && 'mM'.indexOf(list.getItem(i - 1).pathSegTypeAsLetter) >= 0)

        if ('sScCqQtT'.indexOf(cmd) >= 0) {
          hasStartMarker && markers.addMarker(new Marker(markerStart, [x, y], getAngle([x, y], p2)))
          hasEndMarker && markers.addMarker(new Marker(markerEnd, to, getAngle(p3, to)))
          if (hasMidMarker) {
            curAngle = getDirectionVector([x, y], p2)
            curAngle =
              'mM'.indexOf(list.getItem(i - 1).pathSegTypeAsLetter) >= 0
                ? curAngle
                : normalize(addVectors(prevAngle, curAngle))
            markers.addMarker(new Marker(markerMid, [x, y], Math.atan2(curAngle[1], curAngle[0])))
          }

          prevAngle = getDirectionVector(p3, to)

          prevX = x
          prevY = y

          if (context.withinClipPath) {
            p2 = multVecMatrix(p2, context.transform)
            p3 = multVecMatrix(p3, context.transform)
            to = multVecMatrix(to, context.transform)
          }

          lines.push({
            op: 'c',
            c: [p2[0], p2[1], p3[0], p3[1], to[0], to[1]]
          })
        } else if ('lLhHvVmM'.indexOf(cmd) >= 0) {
          curAngle = getDirectionVector([x, y], to)
          hasStartMarker &&
            markers.addMarker(new Marker(markerStart, [x, y], Math.atan2(curAngle[1], curAngle[0])))
          hasEndMarker &&
            markers.addMarker(new Marker(markerEnd, to, Math.atan2(curAngle[1], curAngle[0])))
          if (hasMidMarker) {
            var angle =
              'mM'.indexOf(cmd) >= 0
                ? prevAngle
                : 'mM'.indexOf(list.getItem(i - 1).pathSegTypeAsLetter) >= 0
                ? curAngle
                : normalize(addVectors(prevAngle, curAngle))
            markers.addMarker(new Marker(markerMid, [x, y], Math.atan2(angle[1], angle[0])))
          }
          prevAngle = curAngle

          if (context.withinClipPath) {
            to = multVecMatrix(to, context.transform)
          }

          lines.push({ op: op, c: to })
        }

        if ('MLCSQT'.indexOf(cmd) >= 0) {
          x = seg.x
          y = seg.y
        } else if ('mlcsqt'.indexOf(cmd) >= 0) {
          x = seg.x + x
          y = seg.y + y
        } else if ('zZ'.indexOf(cmd) < 0) {
          x = newX
          y = newY
        }
      }

      return { lines: lines, markers: markers }
    }
    var lines = getLinesFromPath()

    if (lines.lines.length > 0) {
      context._pdf.path(lines.lines)
    }

    if (markerEnd || markerStart || markerMid) {
      lines.markers.draw(context.clone({ transform: context._pdf.unitMatrix }))
    }
  }

  getBoundingBoxCore(context: Context): number[] {
    var list = PathSegList.get(this.element)
    var minX = Number.POSITIVE_INFINITY
    var minY = Number.POSITIVE_INFINITY
    var maxX = Number.NEGATIVE_INFINITY
    var maxY = Number.NEGATIVE_INFINITY
    var x = 0,
      y = 0
    var prevX, prevY, newX, newY
    var pF, p2, p3, to
    for (var i = 0; i < list.numberOfItems; i++) {
      var seg = list.getItem(i)
      var cmd = seg.pathSegTypeAsLetter
      switch (cmd) {
        case 'H':
          newX = seg.x
          newY = y
          break
        case 'h':
          newX = seg.x + x
          newY = y
          break
        case 'V':
          newX = x
          newY = seg.y
          break
        case 'v':
          newX = x
          newY = seg.y + y
          break
        case 'C':
          p2 = [seg.x1, seg.y1]
          p3 = [seg.x2, seg.y2]
          to = [seg.x, seg.y]
          break
        case 'c':
          p2 = [seg.x1 + x, seg.y1 + y]
          p3 = [seg.x2 + x, seg.y2 + y]
          to = [seg.x + x, seg.y + y]
          break
        case 'S':
          p2 = getControlPointFromPrevious(i, [x, y], list, prevX, prevY)
          p3 = [seg.x2, seg.y2]
          to = [seg.x, seg.y]
          break
        case 's':
          p2 = getControlPointFromPrevious(i, [x, y], list, prevX, prevY)
          p3 = [seg.x2 + x, seg.y2 + y]
          to = [seg.x + x, seg.y + y]
          break
        case 'Q':
          pF = [seg.x1, seg.y1]
          p2 = toCubic([x, y], pF)
          p3 = toCubic([seg.x, seg.y], pF)
          to = [seg.x, seg.y]
          break
        case 'q':
          pF = [seg.x1 + x, seg.y1 + y]
          p2 = toCubic([x, y], pF)
          p3 = toCubic([x + seg.x, y + seg.y], pF)
          to = [seg.x + x, seg.y + y]
          break
        case 'T':
          p2 = getControlPointFromPrevious(i, [x, y], list, prevX, prevY)
          p2 = toCubic([x, y], pF)
          p3 = toCubic([seg.x, seg.y], pF)
          to = [seg.x, seg.y]
          break
        case 't':
          pF = getControlPointFromPrevious(i, [x, y], list, prevX, prevY)
          p2 = toCubic([x, y], pF)
          p3 = toCubic([x + seg.x, y + seg.y], pF)
          to = [seg.x + x, seg.y + y]
          break
        // TODO: A,a
      }
      if ('sScCqQtT'.indexOf(cmd) >= 0) {
        prevX = x
        prevY = y
      }
      if ('MLCSQT'.indexOf(cmd) >= 0) {
        x = seg.x
        y = seg.y
      } else if ('mlcsqt'.indexOf(cmd) >= 0) {
        x = seg.x + x
        y = seg.y + y
      } else if ('zZ'.indexOf(cmd) < 0) {
        x = newX
        y = newY
      }
      if ('CSQTcsqt'.indexOf(cmd) >= 0) {
        minX = Math.min(minX, x, p2[0], p3[0], to[0])
        maxX = Math.max(maxX, x, p2[0], p3[0], to[0])
        minY = Math.min(minY, y, p2[1], p3[1], to[1])
        maxY = Math.max(maxY, y, p2[1], p3[1], to[1])
      } else {
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
      }
    }
    return addLineWidth([minX, minY, maxX - minX, maxY - minY], this.element)
  }

  computeNodeTransformCore(context: Context): any {
    return context._pdf.unitMatrix
  }
}
