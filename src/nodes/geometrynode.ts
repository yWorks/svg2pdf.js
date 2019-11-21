import { GraphicsNode } from './graphicsnode'
import { Context } from '../context/context'
import { Path } from '../path'

export abstract class GeometryNode extends GraphicsNode {
  abstract getPath(context: Context): Path
  abstract drawMarker(context: Context, path: Path): void
  renderCore(context: Context) {
    const path = this.getPath(context)
    if (path === null) {
      return
    }
    if (!context.withinClipPath) {
      context._pdf.setCurrentTransformationMatrix(context.transform)
    }
    context._pdf.path(path.toPdfPath())
    this.fillOrStroke(context)
    this.drawMarker(context, path)
  }
}
