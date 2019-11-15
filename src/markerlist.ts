import { Context } from './context/context'

/**
 * @constructor
 * @property {Marker[]} markers
 */
export class MarkerList {
  public markers: Marker[]

  constructor() {
    this.markers = []
  }

  addMarker(marker: Marker) {
    this.markers.push(marker)
  }

  draw(context: Context) {
    for (let i = 0; i < this.markers.length; i++) {
      const marker = this.markers[i]

      let tf
      const angle = marker.angle,
        anchor = marker.anchor
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      // position at and rotate around anchor
      tf = new context._pdf.Matrix(cos, sin, -sin, cos, anchor[0], anchor[1])
      // scale with stroke-width
      tf = context._pdf.matrixMult(
        new context._pdf.Matrix(
          context.attributeState.strokeWidth,
          0,
          0,
          context.attributeState.strokeWidth,
          0,
          0
        ),
        tf
      )

      tf = context._pdf.matrixMult(tf, context.transform)

      // as the marker is already scaled by the current line width we must not apply the line width twice!
      context._pdf.saveGraphicsState()
      context._pdf.setLineWidth(1.0)
      context.refsHandler.getRendered(marker.id, context)
      context._pdf.doFormObject(marker.id, tf)
      context._pdf.restoreGraphicsState()
    }
  }
}

/**
 * @param {string} id
 * @param {[number,number]} anchor
 * @param {number} angle
 */
export class Marker {
  id: string
  anchor: number[]
  angle: number

  constructor(id: string, anchor: number[], angle: number) {
    this.id = id
    this.anchor = anchor
    this.angle = angle
  }
}
