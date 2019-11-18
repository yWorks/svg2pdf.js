import { SvgNode } from './svgnode'
import { Context } from '../context/context'
import { parsePointsString } from '../utils/misc'
import { getAttribute } from '../utils/node'
import { MarkerList, Marker } from '../markerlist'
import { iriReference } from '../utils/constants'
import { addVectors, getDirectionVector } from '../utils/math'
import { addLineWidth } from '../utils/bbox'

export abstract class Traverse extends SvgNode {
  closed: boolean

  constructor(node: HTMLElement, children: SvgNode[], closed: boolean) {
    super(node, children)
    this.closed = closed
  }

  renderCore(context: Context) {
    if (!context.withinClipPath) {
      context._pdf.setCurrentTransformationMatrix(context.transform)
    }

    if (!this.element.hasAttribute('points') || this.element.getAttribute('points') === '') {
      return
    }

    const points = parsePointsString(this.element.getAttribute('points'))
    const lines = [{ op: 'm', c: points[0] } as any]
    for (let i = 1; i < points.length; i++) {
      lines.push({ op: 'l', c: points[i] })
    }

    this.closed && lines.push({ op: 'h' })

    context._pdf.path(lines)

    let angle, i
    let markerEnd = getAttribute(this.element, 'marker-end'),
      markerStart = getAttribute(this.element, 'marker-start'),
      markerMid = getAttribute(this.element, 'marker-mid')

    if (markerStart || markerMid || markerEnd) {
      const length = lines.length
      const markers = new MarkerList()
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
        let prevAngle = getDirectionVector(lines[0].c, lines[1].c)
        let curAngle
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

    this.fillOrStroke(context)
  }

  visibleCore(visible: boolean) {
    return visible
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
