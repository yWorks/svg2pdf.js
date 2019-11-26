import { Context } from '../context/context'
import { parseFloats } from '../utils/parsing'
import { getAttribute } from '../utils/node'
import { computeViewBoxTransform } from '../utils/transform'
import { RenderedNode } from './renderednode'

export abstract class ContainerNode extends RenderedNode {
  protected renderCore(context: Context): void {
    const clonedContext = context.clone({ withinClipPath: false })
    this.children.forEach(child => {
      clonedContext.transform = context.pdf.matrixMult(
        child.computeNodeTransform(context),
        context.transform
      )
      child.render(clonedContext)
    })
  }
}
