import { Context } from '../context/context'
import { MarkerList } from '../markerlist'
import { Path } from '../path'
import { getAttribute } from '../utils/node'
import { GraphicsNode } from './graphicsnode'

export abstract class GeometryNode extends GraphicsNode {
  protected renderCore(context: Context) {
    const path = this.getPath(context)
    if (path === null) {
      return
    }
    if (!context.withinClipPath) {
      context._pdf.setCurrentTransformationMatrix(context.transform)
    }
    path.drawJsPdfPath(context)
    this.fillOrStroke(context)
    this.drawMarker(context, path)
  }

  protected abstract getPath(context: Context): Path
  drawMarker(context: Context, path: Path) {
    this.getMarkers(context, path).draw(context.clone({ transform: context._pdf.unitMatrix }))
  }

  protected fillOrStroke(context: Context) {
    if (!context.withinClipPath) {
      const fill = context.attributeState.fill
      // pdf spec states: "A line width of 0 denotes the thinnest line that can be rendered at device resolution:
      // 1 device pixel wide". SVG, however, does not draw zero width lines.
      const stroke = context.attributeState.stroke && context.attributeState.strokeWidth !== 0

      const patternOrGradient = fill && fill.key ? fill : undefined
      const isNodeFillRuleEvenOdd = getAttribute(this.element, 'fill-rule') === 'evenodd'
      if (fill && stroke) {
        if (isNodeFillRuleEvenOdd) {
          context._pdf.fillStrokeEvenOdd(patternOrGradient)
        } else {
          context._pdf.fillStroke(patternOrGradient)
        }
      } else if (fill) {
        if (isNodeFillRuleEvenOdd) {
          context._pdf.fillEvenOdd(patternOrGradient)
        } else {
          context._pdf.fill(patternOrGradient)
        }
      } else if (stroke) {
        context._pdf.stroke()
      } else {
        context._pdf.discardPath()
      }
    }
  }

  protected abstract getMarkers(context: Context, path: Path): MarkerList
}
