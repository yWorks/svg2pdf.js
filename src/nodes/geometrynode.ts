import { Context } from '../context/context'
import { Marker, MarkerList } from '../markerlist'
import { Close, CurveTo, LineTo, MoveTo, Path } from '../utils/path'
import { iriReference } from '../utils/constants'
import { addVectors, getAngle, getDirectionVector, normalize } from '../utils/geometry'
import { getAttribute } from '../utils/node'
import { GraphicsNode } from './graphicsnode'
import { SvgNode } from './svgnode'
import { Rect } from '../utils/geometry'

export abstract class GeometryNode extends GraphicsNode {
  private readonly hasMarkers: boolean
  private cachedPath: Path | null = null

  protected constructor(hasMarkers: boolean, element: Element, children: SvgNode[]) {
    super(element, children)
    this.hasMarkers = hasMarkers
  }

  protected async renderCore(context: Context): Promise<void> {
    const path = this.getCachedPath(context)
    if (path === null || path.segments.length === 0) {
      return
    }
    if (context.withinClipPath) {
      path.transform(context.transform)
    } else {
      context.pdf.setCurrentTransformationMatrix(context.transform)
    }
    path.draw(context)
    await this.fillOrStroke(context)
    if (this.hasMarkers) {
      await this.drawMarkers(context, path)
    }
  }

  protected abstract getPath(context: Context): Path | null

  private getCachedPath(context: Context): Path | null {
    return this.cachedPath || (this.cachedPath = this.getPath(context))
  }

  private async drawMarkers(context: Context, path: Path): Promise<void> {
    const markers = this.getMarkers(path, context)
    await markers.draw(context.clone({ transform: context.pdf.unitMatrix }))
  }

  protected async fillOrStroke(context: Context): Promise<void> {
    if (context.withinClipPath) {
      return
    }
    const fill = context.attributeState.fill
    const stroke = context.attributeState.stroke && context.attributeState.strokeWidth !== 0
    const fillData = fill ? await fill.getFillData(this, context) : undefined
    const isNodeFillRuleEvenOdd = context.attributeState.fillRule === 'evenodd'

    // This is a workaround for symbols that are used multiple times with different
    // fill/stroke attributes. All paths within symbols are both filled and stroked
    // and we set the fill/stroke to transparent if the use element has
    // fill/stroke="none".
    if ((fill && stroke) || context.withinUse) {
      if (isNodeFillRuleEvenOdd) {
        context.pdf.fillStrokeEvenOdd(fillData)
      } else {
        context.pdf.fillStroke(fillData)
      }
    } else if (fill) {
      if (isNodeFillRuleEvenOdd) {
        context.pdf.fillEvenOdd(fillData)
      } else {
        context.pdf.fill(fillData)
      }
    } else if (stroke) {
      context.pdf.stroke()
    } else {
      context.pdf.discardPath()
    }
  }

  protected getBoundingBoxCore(context: Context): Rect {
    const path = this.getCachedPath(context)
    if (!path || !path.segments.length) {
      return [0, 0, 0, 0]
    }
    let minX = Number.POSITIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let maxX = Number.NEGATIVE_INFINITY
    let maxY = Number.NEGATIVE_INFINITY
    let x = 0,
      y = 0
    for (let i = 0; i < path.segments.length; i++) {
      const seg = path.segments[i]
      if (seg instanceof MoveTo || seg instanceof LineTo || seg instanceof CurveTo) {
        x = seg.x
        y = seg.y
      }
      if (seg instanceof CurveTo) {
        minX = Math.min(minX, x, seg.x1, seg.x2, seg.x)
        maxX = Math.max(maxX, x, seg.x1, seg.x2, seg.x)
        minY = Math.min(minY, y, seg.y1, seg.y2, seg.y)
        maxY = Math.max(maxY, y, seg.y1, seg.y2, seg.y)
      } else {
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
      }
    }
    return [minX, minY, maxX - minX, maxY - minY]
  }

  protected getMarkers(path: Path, context: Context): MarkerList {
    let markerStart: string | undefined = getAttribute(
      this.element,
      context.styleSheets,
      'marker-start'
    )
    let markerMid: string | undefined = getAttribute(
      this.element,
      context.styleSheets,
      'marker-mid'
    )
    let markerEnd: string | undefined = getAttribute(
      this.element,
      context.styleSheets,
      'marker-end'
    )

    const markers = new MarkerList()
    if (markerStart || markerMid || markerEnd) {
      markerEnd && (markerEnd = iri(markerEnd))
      markerStart && (markerStart = iri(markerStart))
      markerMid && (markerMid = iri(markerMid))

      const list = path.segments
      let prevAngle = [1, 0],
        curAngle,
        first: MoveTo | false = false,
        firstAngle = [1, 0],
        last: MoveTo | LineTo | CurveTo | false = false
      for (let i = 0; i < list.length; i++) {
        const curr = list[i]

        const hasStartMarker =
          markerStart &&
          (i === 1 || (!(list[i] instanceof MoveTo) && list[i - 1] instanceof MoveTo))
        if (hasStartMarker) {
          list.forEach((value, index) => {
            if (!last && value instanceof Close && index > i) {
              const tmp = list[index - 1]
              last =
                (tmp instanceof MoveTo || tmp instanceof LineTo || tmp instanceof CurveTo) && tmp
            }
          })
        }
        const hasEndMarker =
          markerEnd &&
          (i === list.length - 1 || (!(list[i] instanceof MoveTo) && list[i + 1] instanceof MoveTo))
        const hasMidMarker = markerMid && i > 0 && !(i === 1 && list[i - 1] instanceof MoveTo)

        const prev = list[i - 1] || null
        if (prev instanceof MoveTo || prev instanceof LineTo || prev instanceof CurveTo) {
          if (curr instanceof CurveTo) {
            hasStartMarker &&
              markers.addMarker(
                new Marker(
                  markerStart!,
                  [prev.x, prev.y],
                  // @ts-ignore
                  getAngle(last ? [last.x, last.y] : [prev.x, prev.y], [curr.x1, curr.y1])
                )
              )
            hasEndMarker &&
              markers.addMarker(
                new Marker(
                  markerEnd!,
                  [curr.x, curr.y],
                  getAngle([curr.x2, curr.y2], [curr.x, curr.y])
                )
              )
            if (hasMidMarker) {
              curAngle = getDirectionVector([prev.x, prev.y], [curr.x1, curr.y1])
              curAngle =
                prev instanceof MoveTo ? curAngle : normalize(addVectors(prevAngle, curAngle))
              markers.addMarker(
                new Marker(markerMid!, [prev.x, prev.y], Math.atan2(curAngle[1], curAngle[0]))
              )
            }

            prevAngle = getDirectionVector([curr.x2, curr.y2], [curr.x, curr.y])
          } else if (curr instanceof MoveTo || curr instanceof LineTo) {
            curAngle = getDirectionVector([prev.x, prev.y], [curr.x, curr.y])
            if (hasStartMarker) {
              // @ts-ignore
              const angle = last ? getDirectionVector([last.x, last.y], [curr.x, curr.y]) : curAngle
              markers.addMarker(
                new Marker(markerStart!, [prev.x, prev.y], Math.atan2(angle[1], angle[0]))
              )
            }
            hasEndMarker &&
              markers.addMarker(
                new Marker(markerEnd!, [curr.x, curr.y], Math.atan2(curAngle[1], curAngle[0]))
              )
            if (hasMidMarker) {
              const angle =
                curr instanceof MoveTo
                  ? prevAngle
                  : prev instanceof MoveTo
                  ? curAngle
                  : normalize(addVectors(prevAngle, curAngle))
              markers.addMarker(
                new Marker(markerMid!, [prev.x, prev.y], Math.atan2(angle[1], angle[0]))
              )
            }
            prevAngle = curAngle
          } else if (curr instanceof Close) {
            // @ts-ignore
            curAngle = getDirectionVector([prev.x, prev.y], [first.x, first.y])
            if (hasMidMarker) {
              const angle =
                prev instanceof MoveTo ? curAngle : normalize(addVectors(prevAngle, curAngle))
              markers.addMarker(
                new Marker(markerMid!, [prev.x, prev.y], Math.atan2(angle[1], angle[0]))
              )
            }
            if (hasEndMarker) {
              const angle = normalize(addVectors(curAngle, firstAngle))
              markers.addMarker(
                // @ts-ignore
                new Marker(markerEnd, [first.x, first.y], Math.atan2(angle[1], angle[0]))
              )
            }
            prevAngle = curAngle
          }
        } else {
          first = curr instanceof MoveTo && curr
          const next = list[i + 1]
          if (next instanceof MoveTo || next instanceof LineTo || next instanceof CurveTo) {
            // @ts-ignore
            firstAngle = getDirectionVector([first.x, first.y], [next.x, next.y])
          }
        }
      }
    }
    return markers
  }
}

function iri(attribute: string): string | undefined {
  const match = iriReference.exec(attribute)
  return (match && match[1]) || undefined
}
