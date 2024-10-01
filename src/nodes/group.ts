import { Context } from '../context/context'
import { ContainerNode } from './containernode'
import { svgNodeAndChildrenVisible, getAttribute } from '../utils/node'
import { Matrix } from 'jspdf'

export class Group extends ContainerNode {
  isVisible(parentVisible: boolean, context: Context): boolean {
    return svgNodeAndChildrenVisible(this, parentVisible, context)
  }

  protected computeNodeTransformCore(context: Context): Matrix {
    return context.pdf.unitMatrix
  }
}

export class GroupA extends Group {
  protected async renderCore(context: Context): Promise<void> {
    await super.renderCore(context)

    const href = getAttribute(this.element, context.styleSheets, 'href')
    if (href) {
      const box = this.getBoundingBox(context)
      const scale = context.pdf.internal.scaleFactor
      const ph = context.pdf.internal.pageSize.getHeight()

      context.pdf.link(scale*(box[0] * context.transform.sx + context.transform.tx),
                       ph - scale*(box[1] * context.transform.sy + context.transform.ty), scale*box[2], scale*box[3], { url: href })
    }
  }
}
