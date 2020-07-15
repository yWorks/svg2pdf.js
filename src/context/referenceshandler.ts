import cssEsc from 'cssesc'
import { NonRenderedNode } from '../nodes/nonrenderednode'
import { SvgNode } from '../nodes/svgNode'
import { Context } from './context'
import { Svg } from '../nodes/svg'
import { getBoundingBoxByChildren } from '../utils/bbox'

/**
 * @constructor
 * @param rootSvg
 * @property renderedElements
 * @property rootSvg
 */
export class ReferencesHandler {
  private readonly renderedElements: { [key: string]: SvgNode }
  private readonly idMap: { [id: string]: SvgNode }

  constructor(idMap: { [id: string]: SvgNode }) {
    this.renderedElements = {}
    this.idMap = idMap
  }

  public async getRendered(id: string, context: Context): Promise<SvgNode> {
    if (this.renderedElements.hasOwnProperty(id)) {
      return this.renderedElements[id]
    }

    const svgNode: SvgNode = this.get(id)

    if (svgNode instanceof NonRenderedNode) {
      await svgNode.apply(context)
    } else {
      const bBox =
        svgNode instanceof Svg
          ? getBoundingBoxByChildren(context, svgNode)
          : svgNode.getBoundingBox(context)
      context.pdf.beginFormObject(bBox[0], bBox[1], bBox[2], bBox[3], context.pdf.unitMatrix)
      await svgNode.render(new Context(context.pdf, { refsHandler: this }))
      context.pdf.endFormObject(svgNode.element.getAttribute('id'))
    }

    this.renderedElements[id] = svgNode
    return svgNode
  }

  get(id: string): SvgNode {
    return this.idMap[cssEsc(id, { isIdentifier: true })]
  }
}
