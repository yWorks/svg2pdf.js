import cssEsc from 'cssesc'
import { PassiveNode } from '../nodes/passivenode'
import { SvgNode } from '../nodes/svgnode'
import { nodeIs } from '../utils/node'
import { Context } from './context'

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
    if (this.renderedElements.hasOwnProperty(id)) {
      return this.renderedElements[id]
    }

    const svgnode: SvgNode = this.idMap[cssEsc(id, { isIdentifier: true })]

    if (svgnode instanceof PassiveNode) {
      svgnode.renderPassive(context)
    } else if (!nodeIs(svgnode.element, 'clippath')) {
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
}
