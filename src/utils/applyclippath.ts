import { Context } from '../context/context'
import { ClipPath } from '../nodes/clippath'
import { SvgNode } from '../nodes/svgnode'
import { iriReference } from './constants'

export function getClipPathNode(
  clipPathAttr: string,
  targetNode: SvgNode,
  context: Context
): ClipPath | undefined {
  const match = iriReference.exec(clipPathAttr)
  if (!match) {
    return undefined
  }
  const clipPathId = match[1]
  const clipNode = context.refsHandler.get(clipPathId)
  return (clipNode as ClipPath) || undefined
}

export async function applyClipPath(
  targetNode: SvgNode,
  clipPathNode: ClipPath,
  context: Context
): Promise<void> {
  const clipContext = context.clone()
  if (
    clipPathNode.element.hasAttribute('clipPathUnits') &&
    clipPathNode.element.getAttribute('clipPathUnits')!.toLowerCase() === 'objectboundingbox'
  ) {
    const bBox = targetNode.getBoundingBox(context)
    clipContext.transform = context.pdf.matrixMult(
      context.pdf.Matrix(bBox[2], 0, 0, bBox[3], bBox[0], bBox[1]),
      context.transform
    )
  }
  await clipPathNode.apply(clipContext)
}
