import cssEsc from 'cssesc'
import { NonRenderedNode } from '../nodes/nonrenderednode'
import { SvgNode } from '../nodes/svgnode'
import { Context } from './context'
import { ClipPath } from '../nodes/clippath'

/**
 * @constructor
 * @param {Element} rootSvg
 * @property {Object.<String,Element>} renderedElements
 * @property {Element} rootSvg
 */
export class ReferencesHandler {
  private renderedElements: any
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
    const svgnode: SvgNode = this.get(id)

    if (this.renderedElements.hasOwnProperty(id) && !(svgnode instanceof ClipPath)) {
      return this.renderedElements[id]
    }

    if (svgnode instanceof NonRenderedNode) {
      svgnode.apply(context)
    } else {
      // the transformations directly at the node are written to the pdf form object transformation matrix
      let childContext = new Context(context._pdf, { refsHandler: this })
      const tfMatrix = svgnode.computeNodeTransform(childContext)
      const bBox = svgnode.getBBox(context)

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
