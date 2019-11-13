import * as Constants from '../utils/constants'
import Context from '../context/context'
import Marker from '../marker'
import MarkerList from '../markerlist'
import NodeStructureTree from './nst'
import { getAngle } from '../utils/math'
import { defaultBoundingBox, addLineWidth } from '../utils/bbox'
import { getAttribute } from '../utils/node'

export default class Line extends NodeStructureTree {
  renderCore(context: Context): void {
    if (!context.withinClipPath) {
      context._pdf.setCurrentTransformationMatrix(context.transform)
      var p1 = [
        parseFloat(this.element.getAttribute('x1')) || 0,
        parseFloat(this.element.getAttribute('y1')) || 0
      ]
      var p2 = [
        parseFloat(this.element.getAttribute('x2')) || 0,
        parseFloat(this.element.getAttribute('y2')) || 0
      ]

      if (context.attributeState.stroke !== null) {
        context._pdf.line(p1[0], p1[1], p2[0], p2[1])
      }

      var markerStart = getAttribute(this.element, 'marker-start'),
        markerEnd = getAttribute(this.element, 'marker-end')

      if (markerStart || markerEnd) {
        var markers = new MarkerList()
        var angle = getAngle(p1, p2)
        if (markerStart) {
          markers.addMarker(new Marker(Constants.iriReference.exec(markerStart)[1], p1, angle))
        }
        if (markerEnd) {
          markers.addMarker(new Marker(Constants.iriReference.exec(markerEnd)[1], p2, angle))
        }
        markers.draw(context.clone({ transform: context._pdf.unitMatrix }))
      }
    }
  }

  getBoundingBoxCore(context: Context): number[] {
    return addLineWidth(defaultBoundingBox(this.element, context), this.element)
  }

  computeNodeTransformCore(context:Context):any{
    return context._pdf.unitMatrix
  }
}
