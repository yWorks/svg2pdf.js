import { SvgNode } from './svgnode'
import { Context } from '../context/context'
import { MarkerList, Marker } from '../markerlist'
import { getAngle } from '../utils/math'
import { defaultBoundingBox, addLineWidth } from '../utils/bbox'
import { getAttribute } from '../utils/node'
import { iriReference } from '../utils/constants'

export class Line extends SvgNode {
  renderCore(context: Context): void {
    if (!context.withinClipPath) {
      context._pdf.setCurrentTransformationMatrix(context.transform)
      const p1 = [
        parseFloat(this.element.getAttribute('x1')) || 0,
        parseFloat(this.element.getAttribute('y1')) || 0
      ]
      const p2 = [
        parseFloat(this.element.getAttribute('x2')) || 0,
        parseFloat(this.element.getAttribute('y2')) || 0
      ]

      if (context.attributeState.stroke !== null) {
        context._pdf.line(p1[0], p1[1], p2[0], p2[1])
      }

      const markerStart = getAttribute(this.element, 'marker-start'),
        markerEnd = getAttribute(this.element, 'marker-end')

      if (markerStart || markerEnd) {
        let markers = new MarkerList()
        const angle = getAngle(p1, p2)
        if (markerStart) {
          markers.addMarker(new Marker(iriReference.exec(markerStart)[1], p1, angle))
        }
        if (markerEnd) {
          markers.addMarker(new Marker(iriReference.exec(markerEnd)[1], p2, angle))
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
}
