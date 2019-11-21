import { Context } from '../context/context'
import { Marker, MarkerList } from '../markerlist'
import { Path, CurveTo, MoveTo, LineTo } from '../path'
import { iriReference } from '../utils/constants'
import { addVectors, getAngle, getDirectionVector, normalize } from '../utils/math'
import { getAttribute, svgNodeIsVisible } from '../utils/node'
import { SvgClose, SvgCurveTo, SvgLineTo, SvgMoveTo, SvgPathAdapter } from '../utils/svgpathadapter'
import { GeometryNode } from './geometrynode'
import { SvgNode } from './svgnode'
import { addLineWidth } from '../utils/bbox'

export class PathNode extends GeometryNode {
  private path: Path
  private markers: MarkerList

  constructor(node: HTMLElement, children: SvgNode[]) {
    super(node, children)
  }

  protected getPath(context: Context) {
    this.getPathAndMarkersFromSvgPath(context)
    if (this.path.segments.length === 0) {
      return null
    } else {
      return this.path
    }
  }

  protected getMarkers(context: Context, path: Path) {
    let markerEnd = getAttribute(this.element, 'marker-end'),
      markerStart = getAttribute(this.element, 'marker-start'),
      markerMid = getAttribute(this.element, 'marker-mid')
    let marker: { start: any; mid: any; end: any } = { start: null, mid: null, end: null }
    markerEnd && (marker.end = iriReference.exec(markerEnd)[1])
    markerStart && (marker.start = iriReference.exec(markerStart)[1])
    markerMid && (marker.mid = iriReference.exec(markerMid)[1])
    this.getPathAndMarkersFromSvgPath(context, marker)
    return this.markers
  }

  protected getBoundingBoxCore(context: Context): number[] {
    this.getPathAndMarkersFromSvgPath(context)
    let minX = Number.POSITIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY
    let x = 0,
      y = 0
    for (let i = 0; i < this.path.segments.length; i++) {
      const seg = this.path.segments[i]
      if (seg instanceof MoveTo || seg instanceof LineTo || seg instanceof CurveTo) {
        x = seg.x
        y = seg.y
      }
      if (seg instanceof CurveTo) {
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

  protected computeNodeTransformCore(context: Context): any {
    return context._pdf.unitMatrix
  }
  isVisible(parentVisible: boolean): boolean {
    return svgNodeIsVisible(this, parentVisible)
  }

  private getPathAndMarkersFromSvgPath(
    context: Context,
    marker?: { start: any; mid: any; end: any }
  ) {
    const list = new SvgPathAdapter(this.element).getSegments(
      context.withinClipPath ? 'matrix(' + context.transform.toString() + ')' : ''
    )
    let x = 0,
      y = 0
    let x0 = x,
      y0 = y
    let newX, newY
    let to, p2, p3
    let markers = new MarkerList()
    let cmd
    let prevAngle = [0, 0],
      curAngle
    const path = new Path()
    for (let i = 0; i < list.length; i++) {
      const seg = list[i]
      if (seg instanceof SvgMoveTo) {
        path.moveTo(seg.x, seg.y)
        cmd = 'M'
        x0 = x
        y0 = y
        to = [seg.x, seg.y]
      } else if (seg instanceof SvgLineTo) {
        path.lineTo(seg.x, seg.y)
        cmd = 'L'
        to = [seg.x, seg.y]
      } else if (seg instanceof SvgCurveTo) {
        path.curveTo(seg.x1, seg.y1, seg.x2, seg.y2, seg.x, seg.y)
        cmd = 'C'
        p2 = [seg.x1, seg.y1]
        p3 = [seg.x2, seg.y2]
        to = [seg.x, seg.y]
      } else if (seg instanceof SvgClose) {
        path.close()
        cmd = 'Z'
        x = x0
        y = y0
      }
      if (marker) {
        const hasStartMarker =
          marker.start && (i === 1 || (cmd !== 'M' && list[i - 1] instanceof SvgMoveTo))
        const hasEndMarker =
          marker.end && (i === list.length - 1 || (cmd !== 'M' && list[i + 1] instanceof SvgMoveTo))
        const hasMidMarker = marker.mid && i > 0 && !(i === 1 && list[i - 1] instanceof SvgMoveTo)

        if ('CQ'.indexOf(cmd) >= 0) {
          hasStartMarker &&
            markers.addMarker(new Marker(marker.start, [x, y], getAngle([x, y], p2)))
          hasEndMarker && markers.addMarker(new Marker(marker.end, to, getAngle(p3, to)))
          if (hasMidMarker) {
            curAngle = getDirectionVector([x, y], p2)
            curAngle =
              list[i - 1] instanceof SvgMoveTo
                ? curAngle
                : normalize(addVectors(prevAngle, curAngle))
            markers.addMarker(new Marker(marker.mid, [x, y], Math.atan2(curAngle[1], curAngle[0])))
          }

          prevAngle = getDirectionVector(p3, to)
        } else if ('LHVM'.indexOf(cmd) >= 0) {
          curAngle = getDirectionVector([x, y], to)
          hasStartMarker &&
            markers.addMarker(
              new Marker(marker.start, [x, y], Math.atan2(curAngle[1], curAngle[0]))
            )
          hasEndMarker &&
            markers.addMarker(new Marker(marker.end, to, Math.atan2(curAngle[1], curAngle[0])))
          if (hasMidMarker) {
            let angle =
              cmd === 'M'
                ? prevAngle
                : list[i - 1] instanceof SvgMoveTo
                ? curAngle
                : normalize(addVectors(prevAngle, curAngle))
            markers.addMarker(new Marker(marker.mid, [x, y], Math.atan2(angle[1], angle[0])))
          }
          prevAngle = curAngle
        }

        if (seg instanceof SvgMoveTo || seg instanceof SvgLineTo || seg instanceof SvgCurveTo) {
          x = seg.x
          y = seg.y
        } else if (seg instanceof SvgClose) {
          x = newX
          y = newY
        }
      }
    }

    this.path = path
    this.markers = markers
  }
}
