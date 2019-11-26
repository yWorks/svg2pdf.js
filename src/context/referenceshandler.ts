import cssEsc from 'cssesc'
import { NonRenderedNode } from '../nodes/nonrenderednode'
import { SvgNode } from '../nodes/svgnode'
import { Context } from './context'

/**
 * @constructor
 * @param rootSvg
 * @property renderedElements
 * @property rootSvg
 */
export class ReferencesHandler {
  private readonly renderedElements: any
  private readonly idMap: { [id: string]: SvgNode }

  constructor(idMap: { [id: string]: SvgNode }) {
    this.renderedElements = {}
    this.idMap = idMap
  }

  public getRendered(id: string, context: Context): SvgNode {
    if (this.renderedElements.hasOwnProperty(id)) {
      return this.renderedElements[id]
    }

    const svgNode: SvgNode = this.get(id)

    if (svgNode instanceof NonRenderedNode) {
      svgNode.apply(context)
    } else {
      // the transformations directly at the node are written to the pdf form object transformation matrix
      const childContext = new Context(context.pdf, { refsHandler: this })
      const tfMatrix = svgNode.computeNodeTransform(childContext)
      const bBox = svgNode.getBBox(context)

      context.pdf.beginFormObject(bBox[0], bBox[1], bBox[2], bBox[3], tfMatrix)
      svgNode.render(childContext)
      context.pdf.endFormObject(svgNode.element.getAttribute('id'))
    }

    this.renderedElements[id] = svgNode
    return svgNode
  }

  get(id: string): SvgNode {
    return this.idMap[cssEsc(id, { isIdentifier: true })]
  }
}
