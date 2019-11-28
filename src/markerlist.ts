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

  addMarker(markers: Marker): void {
    this.markers.push(markers)
  }

  async draw(context: Context): Promise<void> {
    for (let i = 0; i < this.markers.length; i++) {
      const marker = this.markers[i]

      let tf
      const angle = marker.angle,
        anchor = marker.anchor
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      // position at and rotate around anchor
      tf = new context.pdf.Matrix(cos, sin, -sin, cos, anchor[0], anchor[1])
      // scale with stroke-width
      tf = context.pdf.matrixMult(
        new context.pdf.Matrix(
          context.attributeState.strokeWidth,
          0,
          0,
          context.attributeState.strokeWidth,
          0,
          0
        ),
        tf
      )

      tf = context.pdf.matrixMult(tf, context.transform)

      // as the marker is already scaled by the current line width we must not apply the line width twice!
      context.pdf.saveGraphicsState()
      context.pdf.setLineWidth(1.0)
      await context.refsHandler.getRendered(marker.id, context)
      context.pdf.doFormObject(marker.id, tf)
      context.pdf.restoreGraphicsState()
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
