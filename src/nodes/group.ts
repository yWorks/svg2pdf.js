import { Context } from '../context/context'
import { ContainerNode } from './containernode'
import { svgNodeAndChildrenVisible } from '../utils/node'
import { Matrix } from 'jspdf'

export class Group extends ContainerNode {
  isVisible(parentVisible: boolean, context: Context): boolean {
    return svgNodeAndChildrenVisible(this, parentVisible, context)
  }

  protected computeNodeTransformCore(context: Context): Matrix {
    return context.pdf.unitMatrix
  }
}
