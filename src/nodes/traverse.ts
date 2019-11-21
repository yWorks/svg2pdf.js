import { Context } from '../context/context'
import { Marker, MarkerList } from '../markerlist'
import { addLineWidth } from '../utils/bbox'
import { iriReference } from '../utils/constants'
import { addVectors, getDirectionVector } from '../utils/math'
import { parsePointsString } from '../utils/misc'
import { getAttribute, svgNodeIsVisible } from '../utils/node'
import { GeometryNode } from './geometrynode'
import { SvgNode } from './svgnode'
import { Path, MoveTo, Close, LineTo, CurveTo } from '../path'

export abstract class Traverse extends GeometryNode {
  closed: boolean

  constructor(node: HTMLElement, children: SvgNode[], closed: boolean) {
    super(node, children)
    this.closed = closed
  }

  getPath(context: Context) {
    if (!this.element.hasAttribute('points') || this.element.getAttribute('points') === '') {
      return null
    }

    const points = parsePointsString(this.element.getAttribute('points'))

    const path = new Path().moveTo(points[0][0], points[0][1])
    for (let i = 1; i < points.length; i++) {
      path.lineTo(points[i][0], points[i][1])
    }

    this.closed && path.close()

    return path
  }
  drawMarker(context: Context, path: Path) {
    let angle, i
    let markerEnd = getAttribute(this.element, 'marker-end'),
      markerStart = getAttribute(this.element, 'marker-start'),
      markerMid = getAttribute(this.element, 'marker-mid')
    const length = path.segments.length
    const from = path.segments[0],
      first = path.segments[1],
      to = path.segments[length - 2]
    if (
      (markerStart || markerMid || markerEnd) &&
      from instanceof MoveTo &&
      (first instanceof MoveTo || first instanceof LineTo || first instanceof CurveTo) &&
      (to instanceof MoveTo || to instanceof LineTo || to instanceof CurveTo)
    ) {
      const markers = new MarkerList()

      if (markerStart) {
        markerStart = iriReference.exec(markerStart)[1]

        angle = addVectors(
          getDirectionVector([from.x, from.y], [first.x, first.y]),
          getDirectionVector([to.x, to.y], [from.x, from.y])
        )
        markers.addMarker(new Marker(markerStart, [from.x, from.y], Math.atan2(angle[1], angle[0])))
      }

      if (markerMid) {
        markerMid = iriReference.exec(markerMid)[1]
        let prevAngle = getDirectionVector([from.x, from.y], [first.x, first.y])
        let curAngle
        for (i = 1; i < length - 2; i++) {
          const curr = path.segments[i],
            next = path.segments[i + 1]
          if (
            (curr instanceof MoveTo || curr instanceof LineTo || curr instanceof CurveTo) &&
            (next instanceof MoveTo || next instanceof LineTo || next instanceof CurveTo)
          ) {
            curAngle = getDirectionVector([curr.x, curr.y], [next.x, next.y])
            angle = addVectors(prevAngle, curAngle)
            markers.addMarker(
              new Marker(markerMid, [curr.x, curr.y], Math.atan2(angle[1], angle[0]))
            )
            prevAngle = curAngle
          }
        }

        curAngle = getDirectionVector([to.x, to.y], [from.x, from.y])
        angle = addVectors(prevAngle, curAngle)
        markers.addMarker(new Marker(markerMid, [to.x, to.y], Math.atan2(angle[1], angle[0])))
      }

      if (markerEnd) {
        markerEnd = iriReference.exec(markerEnd)[1]
        angle = addVectors(
          getDirectionVector([from.x, from.y], [first.x, first.y]),
          getDirectionVector([to.x, to.y], [from.x, from.y])
        )
        markers.addMarker(new Marker(markerEnd, [from.x, from.y], Math.atan2(angle[1], angle[0])))
      }
      markers.draw(context.clone({ transform: context._pdf.unitMatrix }))
    }
  }

  isVisible(parentVisible: boolean): boolean {
    return svgNodeIsVisible(this, parentVisible)
  }

  getBoundingBoxCore(context: Context): number[] {
    const points = parsePointsString(this.element.getAttribute('points'))
    let minX = Number.POSITIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY
    for (let i = 0; i < points.length; i++) {
      const point = points[i]
      minX = Math.min(minX, point[0])
      maxX = Math.max(maxX, point[0])
      minY = Math.min(minY, point[1])
      maxY = Math.max(maxY, point[1])
    }
    return addLineWidth([minX, minY, maxX - minX, maxY - minY], this.element)
  }

  computeNodeTransformCore(context: Context): any {
    return context._pdf.unitMatrix
  }
}
