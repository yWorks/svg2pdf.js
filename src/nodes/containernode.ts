import { Context } from '../context/context'
import { parseFloats } from '../utils/parsing'
import { getAttribute } from '../utils/node'
import { computeViewBoxTransform } from '../utils/transform'
import { RenderedNode } from './renderednode'

export abstract class ContainerNode extends RenderedNode {
  protected renderCore(context: Context): void {
    this.children.forEach(child => {
      child.render(context)
    })
  }
}
