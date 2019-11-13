import NodeStructureTree from './nst'
import Context from '../context/context'
import MarkerList from '../markerlist'
import { iriReference } from '../utils/constants'
import Marker from '../marker'
import { addVectors, getDirectionVector } from '../utils/math'
import { addLineWidth } from '../utils/bbox'
import { getAttribute } from '../utils/node'
import { parsePointsString } from '../utils/misc'

export default class Polygon extends NodeStructureTree {
  renderCore(context: Context): void {
    if (!context.withinClipPath) {
      context._pdf.setCurrentTransformationMatrix(context.transform)
    }

    var closed = this.element.tagName.toLowerCase() === 'polygon'

    if (!this.element.hasAttribute('points') || this.element.getAttribute('points') === '') {
      return
    }

    var points = parsePointsString(this.element.getAttribute('points'))
    var lines = [{ op: 'm', c: points[0] } as any]
    var i, angle
    for (i = 1; i < points.length; i++) {
      lines.push({ op: 'l', c: points[i] })
    }

    if (closed) {
      lines.push({ op: 'h' })
    }

    context._pdf.path(lines)

    var markerEnd = getAttribute(this.element, 'marker-end'),
      markerStart = getAttribute(this.element, 'marker-start'),
      markerMid = getAttribute(this.element, 'marker-mid')

    if (markerStart || markerMid || markerEnd) {
      var length = lines.length
      var markers = new MarkerList()
      if (markerStart) {
        markerStart = iriReference.exec(markerStart)[1]
        angle = addVectors(
          getDirectionVector(lines[0].c, lines[1].c),
          getDirectionVector(lines[length - 2].c, lines[0].c)
        )
        markers.addMarker(new Marker(markerStart, lines[0].c, Math.atan2(angle[1], angle[0])))
      }

      if (markerMid) {
        markerMid = iriReference.exec(markerMid)[1]
        var prevAngle = getDirectionVector(lines[0].c, lines[1].c),
          curAngle
        for (i = 1; i < lines.length - 2; i++) {
          curAngle = getDirectionVector(lines[i].c, lines[i + 1].c)
          angle = addVectors(prevAngle, curAngle)
          markers.addMarker(new Marker(markerMid, lines[i].c, Math.atan2(angle[1], angle[0])))
          prevAngle = curAngle
        }

        curAngle = getDirectionVector(lines[length - 2].c, lines[0].c)
        angle = addVectors(prevAngle, curAngle)
        markers.addMarker(
          new Marker(markerMid, lines[length - 2].c, Math.atan2(angle[1], angle[0]))
        )
      }

      if (markerEnd) {
        markerEnd = iriReference.exec(markerEnd)[1]
        angle = addVectors(
          getDirectionVector(lines[0].c, lines[1].c),
          getDirectionVector(lines[length - 2].c, lines[0].c)
        )
        markers.addMarker(new Marker(markerEnd, lines[0].c, Math.atan2(angle[1], angle[0])))
      }
      markers.draw(context.clone({ transform: context._pdf.unitMatrix }))
    }
  }

  getBoundingBoxCore(context: Context): number[] {
    var points = parsePointsString(this.element.getAttribute('points'))
    var minX = Number.POSITIVE_INFINITY
    var minY = Number.POSITIVE_INFINITY
    var maxX = Number.NEGATIVE_INFINITY
    var maxY = Number.NEGATIVE_INFINITY
    for (var i = 0; i < points.length; i++) {
      var point = points[i]
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
