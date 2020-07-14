import { Context } from '../context/context'
import { RenderedNode } from './renderednode'

export abstract class ContainerNode extends RenderedNode {
  protected async renderCore(context: Context): Promise<void> {
    for (const child of this.children) {
      await child.render(context)
    }
  }
}
