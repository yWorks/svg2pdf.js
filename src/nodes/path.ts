import { Context } from '../context/context'
import { Path } from '../path'
import { svgNodeIsVisible } from '../utils/node'
import { SvgClose, SvgCurveTo, SvgLineTo, SvgMoveTo, SvgPathAdapter } from '../utils/svgpathadapter'
import { GeometryNode } from './geometrynode'
import { SvgNode } from './svgnode'

export class PathNode extends GeometryNode {
  constructor(node: HTMLElement, children: SvgNode[]) {
    super(node, children)
    this.hasMarker = true
  }

  protected computeNodeTransformCore(context: Context): any {
    return context._pdf.unitMatrix
  }
  isVisible(parentVisible: boolean, context: Context): boolean {
    return svgNodeIsVisible(this, parentVisible, context)
  }

  protected getPath(context: Context) {
    const list = new SvgPathAdapter(this.element, context).getSegments(
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
