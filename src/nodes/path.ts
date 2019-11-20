import { Context } from '../context/context'
import { Marker, MarkerList } from '../markerlist'
import { addLineWidth } from '../utils/bbox'
import { iriReference } from '../utils/constants'
import { addVectors, getAngle, getDirectionVector, normalize, toCubic } from '../utils/math'
import { getAttribute, svgNodeIsVisible } from '../utils/node'
import { Path, PathSeg, PathSegment } from '../utils/path'
import { SvgNode } from './svgnode'

export class PathNode extends SvgNode {
  path: Path
  lines: {}[]
  marker: { start: string; mid: string; end: string }

  constructor(node: HTMLElement, children: SvgNode[]) {
    super(node, children)
    this.marker = { start: null, mid: null, end: null }
  }

  renderCore(context: Context): void {
    if (!context.withinClipPath) {
      context._pdf.setCurrentTransformationMatrix(context.transform)
    }

    let markerEnd = getAttribute(this.element, 'marker-end'),
      markerStart = getAttribute(this.element, 'marker-start'),
      markerMid = getAttribute(this.element, 'marker-mid')

    markerEnd && (this.marker.end = iriReference.exec(markerEnd)[1])
    markerStart && (this.marker.start = iriReference.exec(markerStart)[1])
    markerMid && (this.marker.mid = iriReference.exec(markerMid)[1])

    let lines = this.getLinesFromPath(context)

    if (lines.lines.length > 0) {
      context._pdf.path(lines.lines)
    }

    if (markerEnd || markerStart || markerMid) {
      lines.markers.draw(context.clone({ transform: context._pdf.unitMatrix }))
    }

    this.fillOrStroke(context)
  }

  getBoundingBoxCore(context: Context): number[] {
    const lines = this.getLinesFromPath(context)
    let minX = Number.POSITIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY
    let x = 0,
      y = 0
    for (let i = 0; i < lines.lines.length; i++) {
      const seg: PathSeg = new PathSegment(
        [lines.lines[i].op.toUpperCase() as any].concat(lines.lines[i].c)
      )
      const cmd = seg.pathSegTypeAsLetter
      if ('MLC'.indexOf(cmd) >= 0) {
        x = seg.x
        y = seg.y
      }
      if ('C'.indexOf(cmd) >= 0) {
        minX = Math.min(minX, x, seg.x1, seg.x2, seg.x)
        maxX = Math.max(maxX, x, seg.x1, seg.x2, seg.x)
        minY = Math.min(minY, y, seg.y1, seg.y2, seg.y)
        maxY = Math.max(maxY, y, seg.y1, seg.y2, seg.y)
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
  isVisible(parentVisible: boolean): boolean {
    return svgNodeIsVisible(this, parentVisible)
  }

  private getLinesFromPath(context: Context) {
    const list = (this.path || (this.path = new Path(this.element))).getSegments(
      context.withinClipPath ? 'matrix(' + context.transform.toString() + ')' : ''
    )
    let x = 0,
      y = 0
    let x0 = x,
      y0 = y
    let newX, newY
    let to, p, p2, p3
    let lines = []
    let markers = new MarkerList()
    let op
    let prevAngle = [0, 0],
      curAngle

    for (let i = 0; i < list.length; i++) {
      const seg = list[i]
      const cmd = seg.pathSegTypeAsLetter
      switch (cmd) {
        case 'M':
          x0 = x
          y0 = y
          to = [seg.x, seg.y]
          op = 'm'
          break
        case 'L':
          to = [seg.x, seg.y]
          op = 'l'
          break
        case 'H':
          to = [seg.x, y]
          op = 'l'
          newX = seg.x
          newY = y
          break
        case 'V':
          to = [x, seg.y]
          op = 'l'
          newX = x
          newY = seg.y
          break
        case 'C':
          p2 = [seg.x1, seg.y1]
          p3 = [seg.x2, seg.y2]
          to = [seg.x, seg.y]
          break
        case 'Q':
          p = [seg.x1, seg.y1]
          p2 = toCubic([x, y], p)
          p3 = toCubic([seg.x, seg.y], p)
          to = [seg.x, seg.y]
          break
        case 'Z':
          x = x0
          y = y0
          lines.push({ op: 'h' })
          break
      }

      const hasStartMarker =
        this.marker.start && (i === 1 || (cmd !== 'M' && list[i - 1].pathSegTypeAsLetter === 'M'))
      const hasEndMarker =
        this.marker.end &&
        (i === list.length - 1 || (cmd !== 'M' && list[i + 1].pathSegTypeAsLetter === 'M'))
      const hasMidMarker =
        this.marker.mid && i > 0 && !(i === 1 && list[i - 1].pathSegTypeAsLetter === 'M')

      if ('CQ'.indexOf(cmd) >= 0) {
        hasStartMarker &&
          markers.addMarker(new Marker(this.marker.start, [x, y], getAngle([x, y], p2)))
        hasEndMarker && markers.addMarker(new Marker(this.marker.end, to, getAngle(p3, to)))
        if (hasMidMarker) {
          curAngle = getDirectionVector([x, y], p2)
          curAngle =
            list[i - 1].pathSegTypeAsLetter === 'M'
              ? curAngle
              : normalize(addVectors(prevAngle, curAngle))
          markers.addMarker(
            new Marker(this.marker.mid, [x, y], Math.atan2(curAngle[1], curAngle[0]))
          )
        }

        prevAngle = getDirectionVector(p3, to)

        lines.push({
          op: 'c',
          c: [p2[0], p2[1], p3[0], p3[1], to[0], to[1]]
        })
      } else if ('LHVM'.indexOf(cmd) >= 0) {
        curAngle = getDirectionVector([x, y], to)
        hasStartMarker &&
          markers.addMarker(
            new Marker(this.marker.start, [x, y], Math.atan2(curAngle[1], curAngle[0]))
          )
        hasEndMarker &&
          markers.addMarker(new Marker(this.marker.end, to, Math.atan2(curAngle[1], curAngle[0])))
        if (hasMidMarker) {
          let angle =
            cmd === 'M'
              ? prevAngle
              : list[i - 1].pathSegTypeAsLetter === 'M'
              ? curAngle
              : normalize(addVectors(prevAngle, curAngle))
          markers.addMarker(new Marker(this.marker.mid, [x, y], Math.atan2(angle[1], angle[0])))
        }
        prevAngle = curAngle

        lines.push({ op: op, c: to })
      }

      if ('MLCQ'.indexOf(cmd) >= 0) {
        x = seg.x
        y = seg.y
      } else if (cmd !== 'Z') {
        x = newX
        y = newY
      }
    }

    return { lines: lines, markers: markers }
  }
}
