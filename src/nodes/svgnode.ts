import { Context } from '../context/context'
import { getAttribute } from '../utils/node'
import { parseTransform } from '../utils/transform'
import { Rect } from '../utils/geometry'
import { Matrix } from 'jspdf'

export abstract class SvgNode {
  readonly element: Element
  readonly children: SvgNode[]
  protected parent: SvgNode | null

  constructor(element: Element, children: SvgNode[]) {
    this.element = element
    this.children = children
    this.parent = null
  }

  setParent(parent: SvgNode): void {
    this.parent = parent
  }

  getParent(): SvgNode | null {
    return this.parent
  }

  abstract render(parentContext: Context): Promise<void>

  abstract isVisible(parentHidden: boolean, context: Context): boolean

  getBoundingBox(context: Context): number[] {
    if (getAttribute(this.element, context.styleSheets, 'display') === 'none') {
      return [0, 0, 0, 0]
    }
    return this.getBoundingBoxCore(context)
  }

  protected abstract getBoundingBoxCore(context: Context): Rect

  computeNodeTransform(context: Context): Matrix {
    const nodeTransform = this.computeNodeTransformCore(context)
    const transformString = getAttribute(this.element, context.styleSheets, 'transform')
    if (!transformString) return nodeTransform
    else return context.pdf.matrixMult(nodeTransform, parseTransform(transformString, context))
  }

  protected abstract computeNodeTransformCore(context: Context): Matrix
}
