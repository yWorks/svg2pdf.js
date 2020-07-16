import cssEsc from 'cssesc'
import { SvgNode } from '../nodes/svgNode'

export class ReferencesHandler {
  private readonly renderedElements: { [key: string]: SvgNode }
  private readonly idMap: { [id: string]: SvgNode }

  constructor(idMap: { [id: string]: SvgNode }) {
    this.renderedElements = {}
    this.idMap = idMap
  }

  public async getRendered(
    id: string,
    renderCallback: (node: SvgNode) => Promise<void>
  ): Promise<SvgNode> {
    if (this.renderedElements.hasOwnProperty(id)) {
      return this.renderedElements[id]
    }

    const svgNode: SvgNode = this.get(id)
    this.renderedElements[id] = svgNode

    await renderCallback(svgNode)

    return svgNode
  }

  get(id: string): SvgNode {
    return this.idMap[cssEsc(id, { isIdentifier: true })]
  }
}
