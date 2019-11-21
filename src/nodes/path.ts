import { Context } from '../context/context'
import { CurveTo, LineTo, MoveTo, Path } from '../path'
import { addLineWidth } from '../utils/bbox'
import { svgNodeIsVisible } from '../utils/node'
import { SvgClose, SvgCurveTo, SvgLineTo, SvgMoveTo, SvgPathAdapter } from '../utils/svgpathadapter'
import { GeometryNode } from './geometrynode'
import { SvgNode } from './svgnode'

export class PathNode extends GeometryNode {
  constructor(node: HTMLElement, children: SvgNode[]) {
    super(node, children)
  }

  protected getBoundingBoxCore(context: Context): number[] {
    const path = this.getPath(context)
    let minX = Number.POSITIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY
    let x = 0,
      y = 0
    for (let i = 0; i < path.segments.length; i++) {
      const seg = path.segments[i]
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

  protected getPath(context: Context) {
    const list = new SvgPathAdapter(this.element).getSegments(
      context.withinClipPath ? 'matrix(' + context.transform.toString() + ')' : ''
    )
    if (list.length === 0) {
      return null
    }
    const path = new Path()
    for (let i = 0; i < list.length; i++) {
      const seg = list[i]
      if (seg instanceof SvgMoveTo) {
        path.moveTo(seg.x, seg.y)
      } else if (seg instanceof SvgLineTo) {
        path.lineTo(seg.x, seg.y)
      } else if (seg instanceof SvgCurveTo) {
        path.curveTo(seg.x1, seg.y1, seg.x2, seg.y2, seg.x, seg.y)
      } else if (seg instanceof SvgClose) {
        path.close()
      }
    }

    return path
  }
}
