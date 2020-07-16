import { Context } from '../context/context'
import { RenderedNode } from './renderednode'
import { Rect } from '../utils/geometry'
import { getBoundingBoxByChildren } from '../utils/bbox'

export abstract class ContainerNode extends RenderedNode {
  protected async renderCore(context: Context): Promise<void> {
    for (const child of this.children) {
      await child.render(context)
    }
  }
  protected getBoundingBoxCore(context: Context): Rect {
    return getBoundingBoxByChildren(context, this)
  }
}
