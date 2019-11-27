import { Fill } from './Fill'
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

  getFillData(forNode: GraphicsNode, context: Context): object | undefined {
    // matrix to convert between gradient space and user space
    // for "userSpaceOnUse" this is the current transformation: tfMatrix
    // for "objectBoundingBox" or default, the gradient gets scaled and transformed to the bounding box
    let gradientUnitsMatrix
    if (
      !this.gradient.element.hasAttribute('gradientUnits') ||
      this.gradient.element.getAttribute('gradientUnits').toLowerCase() === 'objectboundingbox'
    ) {
      const bBox = forNode.getBBox(context)
      gradientUnitsMatrix = new context.pdf.Matrix(bBox[2], 0, 0, bBox[3], bBox[0], bBox[1])
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
