import cssEsc from 'cssesc'
import { SvgNode } from '../nodes/svgnode'
import { RGBColor } from '../utils/rgbcolor'

export class ReferencesHandler {
  private readonly renderedElements: { [key: string]: SvgNode }
  private readonly idMap: { [id: string]: SvgNode }
  private readonly idPrefix: string
  private static instanceCounter = 0

  constructor(idMap: { [id: string]: SvgNode }) {
    this.renderedElements = {}
    this.idMap = idMap
    this.idPrefix = String(ReferencesHandler.instanceCounter++)
  }

  public async getRendered(
    id: string,
    color: RGBColor | null,
    renderCallback: (node: SvgNode) => Promise<void>
  ): Promise<SvgNode> {
    const key = this.generateKey(id, color)
    if (this.renderedElements.hasOwnProperty(key)) {
      return this.renderedElements[id]
    }

    const svgNode: SvgNode = this.get(id)
    this.renderedElements[key] = svgNode

    await renderCallback(svgNode)

    return svgNode
  }

  get(id: string): SvgNode {
    return this.idMap[cssEsc(id, { isIdentifier: true })]
  }

  public generateKey(id: string, color: RGBColor | null): string {
    return this.idPrefix + '|' + id + '|' + (color || new RGBColor('rgb(0,0,0)')).toRGBA()
  }
}
