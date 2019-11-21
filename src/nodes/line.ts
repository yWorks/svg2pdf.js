import { Context } from '../context/context'
import { Marker, MarkerList } from '../markerlist'
import { LineTo, MoveTo, Path } from '../path'
import { addLineWidth, defaultBoundingBox } from '../utils/bbox'
import { iriReference } from '../utils/constants'
import { getAngle } from '../utils/math'
import { getAttribute, svgNodeIsVisible } from '../utils/node'
import { GeometryNode } from './geometrynode'

export class Line extends GeometryNode {
  getPath(context: Context) {
    if (!context.withinClipPath) {
      const x1 = parseFloat(this.element.getAttribute('x1')) || 0,
        y1 = parseFloat(this.element.getAttribute('y1')) || 0

      const x2 = parseFloat(this.element.getAttribute('x2')) || 0,
        y2 = parseFloat(this.element.getAttribute('y2')) || 0

      if (context.attributeState.stroke !== null && (x1 || x2 || y1 || y2)) {
        return new Path().moveTo(x1, y1).lineTo(x2, y2)
      }
    }
    return null
  }
  drawMarker(context: Context, path: Path) {
    const markerStart = getAttribute(this.element, 'marker-start'),
      markerEnd = getAttribute(this.element, 'marker-end')

    if (markerStart || markerEnd) {
      let markers = new MarkerList()
      const from = path.segments[0],
        to = path.segments[1]
      if (from instanceof MoveTo && to instanceof LineTo) {
        const angle = getAngle([from.x, from.y], [to.x, to.y])
        if (markerStart) {
          markers.addMarker(new Marker(iriReference.exec(markerStart)[1], [from.x, from.y], angle))
        }
        if (markerEnd) {
          markers.addMarker(new Marker(iriReference.exec(markerEnd)[1], [to.x, to.y], angle))
        }
        markers.draw(context.clone({ transform: context._pdf.unitMatrix }))
      }
    }
  }

  getBoundingBoxCore(context: Context): number[] {
    return addLineWidth(defaultBoundingBox(this.element, context), this.element)
  }

  computeNodeTransformCore(context: Context): any {
    return context._pdf.unitMatrix
  }

  isVisible(parentVisible: boolean): boolean {
    return svgNodeIsVisible(this, parentVisible)
  }

  fillOrStroke(context: Context) {
    context.attributeState.fill = null
    super.fillOrStroke(context)
  }
}
