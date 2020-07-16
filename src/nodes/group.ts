import { Context } from '../context/context'
import { getBoundingBoxByChildren } from '../utils/bbox'
import { ContainerNode } from './containernode'
import { svgNodeAndChildrenVisible } from '../utils/node'
import { Rect } from '../utils/geometry'
import { Matrix } from 'jspdf'

export class Group extends ContainerNode {
  isVisible(parentVisible: boolean): boolean {
    return svgNodeAndChildrenVisible(this, parentVisible)
  }

  protected computeNodeTransformCore(context: Context): Matrix {
    return context.pdf.unitMatrix
  }
}
