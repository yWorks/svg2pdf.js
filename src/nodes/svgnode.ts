import { Context } from '../context/context'
import { iriReference } from '../utils/constants'
import { getAttribute } from '../utils/node'
import { parseTransform } from '../utils/transform'

export abstract class SvgNode {
  element: HTMLElement
  parent: SvgNode
  children: SvgNode[]

  constructor(element: HTMLElement, children: SvgNode[]) {
    this.element = element
    this.children = children
    this.parent = null
  }

  protected abstract getBoundingBoxCore(context: Context): number[]
  getBBox(context: Context): number[] {
    if (getAttribute(this.element, 'display', context.styleSheets) === 'none') {
      return [0, 0, 0, 0]
    }
    return this.getBoundingBoxCore(context)
  }

  protected abstract computeNodeTransformCore(context: Context): any
  computeNodeTransform(context: Context): any {
    const nodeTransform = this.computeNodeTransformCore(context)
    const transformString = getAttribute(this.element, 'transform', context.styleSheets)
    if (!transformString) return nodeTransform
    else return context._pdf.matrixMult(nodeTransform, parseTransform(transformString, context))
  }

  abstract render(parentContext: Context): void

  abstract isVisible(parentHidden: boolean, context:Context): boolean
}
