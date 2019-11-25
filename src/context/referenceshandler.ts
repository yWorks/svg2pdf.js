import cssEsc from 'cssesc'
import { NonRenderedNode } from '../nodes/nonrenderednode'
import { SvgNode } from '../nodes/svgnode'
import { Context } from './context'
import { ClipPath } from '../nodes/clippath'
import { Symbol } from '../nodes/symbol'
import { Svg } from '../nodes/svg'
import { getBoundingBoxByChildren } from '../utils/bbox'

/**
 * @constructor
 * @param {Element} rootSvg
 * @property {Object.<String,Element>} renderedElements
 * @property {Element} rootSvg
 */
export class ReferencesHandler {
  renderedElements: any
  private idMap: { [id: string]: SvgNode }

  constructor(idMap: { [id: string]: SvgNode }) {
    this.renderedElements = {}
    this.idMap = idMap
  }

  /**
   * @param {string} id
   * @return {*}
   */
  getRendered(id: string, context: Context): SvgNode {
    if (this.renderedElements.hasOwnProperty(id)) {
      return this.renderedElements[id]
    }

    this.renderedElements[id] = 'todo'

    const svgnode: SvgNode = this.get(id)

    if (svgnode instanceof NonRenderedNode) {
      svgnode.apply(context)
    } else {
      let childContext = new Context(context._pdf, { refsHandler: this }),
        tfMatrix,
        bBox

      if (svgnode instanceof Symbol || svgnode instanceof Svg) {
        tfMatrix = context._pdf.unitMatrix
        bBox =
          svgnode instanceof Svg
            ? getBoundingBoxByChildren(context, svgnode)
            : svgnode.getBBox(context)
      } else {
        tfMatrix = svgnode.computeNodeTransform(childContext)
        bBox = svgnode.getBBox(context)
      }

      context._pdf.beginFormObject(bBox[0], bBox[1], bBox[2], bBox[3], tfMatrix)
      svgnode.render(childContext)
      context._pdf.endFormObject(svgnode.element.getAttribute('id'))
    }

    this.renderedElements[id] = svgnode
    return svgnode
  }

  get(id: string) {
    return this.idMap[cssEsc(id, { isIdentifier: true })]
  }
}
