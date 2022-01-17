import { Context } from '../context/context'
import { Path } from '../utils/path'
import { getAttribute, svgNodeIsVisible } from '../utils/node'
import { GeometryNode } from './geometrynode'
import { SvgNode } from './svgnode'
import SvgPath from 'svgpath'
import { toCubic } from '../utils/geometry'
import { Matrix } from 'jspdf'

export class PathNode extends GeometryNode {
  constructor(node: Element, children: SvgNode[]) {
    super(true, node, children)
  }

  protected computeNodeTransformCore(context: Context): Matrix {
    return context.pdf.unitMatrix
  }
  isVisible(parentVisible: boolean, context: Context): boolean {
    return svgNodeIsVisible(this, parentVisible, context)
  }

  protected getPath(context: Context): Path | null {
    const svgPath = new SvgPath(getAttribute(this.element, context.styleSheets, 'd') || '')
      .unshort()
      .unarc()
      .abs()

    const path = new Path()

    let prevX: number
    let prevY: number
    svgPath.iterate(seg => {
      switch (seg[0]) {
        case 'M':
          path.moveTo(seg[1], seg[2])
          break
        case 'L':
          path.lineTo(seg[1], seg[2])
          break
        case 'H':
          path.lineTo(seg[1], prevY)
          break
        case 'V':
          path.lineTo(prevX, seg[1])
          break
        case 'C':
          path.curveTo(seg[1], seg[2], seg[3], seg[4], seg[5], seg[6])
          break
        case 'Q':
          const p2 = toCubic([prevX, prevY], [seg[1], seg[2]])
          const p3 = toCubic([seg[3], seg[4]], [seg[1], seg[2]])
          path.curveTo(p2[0], p2[1], p3[0], p3[1], seg[3], seg[4])
          break
        case 'Z':
          path.close()
          break
      }
      switch (seg[0]) {
        case 'M':
        case 'L':
          prevX = seg[1]
          prevY = seg[2]
          break
        case 'H':
          prevX = seg[1]
          break
        case 'V':
          prevY = seg[1]
          break
        case 'C':
          prevX = seg[5]
          prevY = seg[6]
          break
        case 'Q':
          prevX = seg[3]
          prevY = seg[4]
          break
      }
    })

    return path
  }
}
