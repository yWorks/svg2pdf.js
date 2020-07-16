import { Fill, FillData } from './Fill'
import { Context } from '../context/context'
import { parseTransform } from '../utils/transform'
import { getAttribute } from '../utils/node'
import { Gradient } from '../nodes/gradient'
import { GraphicsNode } from '../nodes/graphicsnode'

export class GradientFill implements Fill {
  private readonly key: string
  private readonly gradient: Gradient

  constructor(key: string, gradient: Gradient) {
    this.key = key
    this.gradient = gradient
  }

  async getFillData(forNode: GraphicsNode, context: Context): Promise<FillData | undefined> {
    await context.refsHandler.getRendered(this.key, node =>
      (node as Gradient).apply(
        new Context(context.pdf, {
          refsHandler: context.refsHandler,
          textMeasure: context.textMeasure
        })
      )
    )

    // matrix to convert between gradient space and user space
    // for "userSpaceOnUse" this is the current transformation: tfMatrix
    // for "objectBoundingBox" or default, the gradient gets scaled and transformed to the bounding box
    let gradientUnitsMatrix
    if (
      !this.gradient.element.hasAttribute('gradientUnits') ||
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      this.gradient.element.getAttribute('gradientUnits').toLowerCase() === 'objectboundingbox'
    ) {
      const bBox = forNode.getBoundingBox(context)
      gradientUnitsMatrix = context.pdf.Matrix(bBox[2], 0, 0, bBox[3], bBox[0], bBox[1])
    } else {
      gradientUnitsMatrix = context.pdf.unitMatrix
    }

    // matrix that is applied to the gradient before any other transformations
    const gradientTransform = parseTransform(
      getAttribute(this.gradient.element, 'gradientTransform', 'transform'),
      context
    )

    return {
      key: this.key,
      matrix: context.pdf.matrixMult(gradientTransform, gradientUnitsMatrix)
    }
  }
}
