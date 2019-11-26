import { Context } from '../context/context'
import { Marker, MarkerList } from '../markerlist'
import { Close, CurveTo, LineTo, MoveTo, Path } from '../utils/path'
import { iriReference } from '../utils/constants'
import { addVectors, getAngle, getDirectionVector, normalize } from '../utils/geometry'
import { getAttribute } from '../utils/node'
import { SvgMoveTo } from '../utils/svgpathadapter'
import { GraphicsNode } from './graphicsnode'
import { addLineWidth } from '../utils/bbox'
import { SvgNode } from './svgnode'
import { Rect } from '../utils/geometry'

export abstract class GeometryNode extends GraphicsNode {
  private readonly hasMarkers: boolean

  protected constructor(hasMarkers: boolean, element: HTMLElement, children: SvgNode[]) {
    super(element, children)
    this.hasMarkers = hasMarkers
  }

  protected renderCore(context: Context): void {
    const path = this.getPath(context)
    if (path === null) {
      return
    }
    if (!context.withinClipPath) {
      context.pdf.setCurrentTransformationMatrix(context.transform)
    }
    path.draw(context)
    this.fillOrStroke(context)
    this.hasMarkers && this.drawMarkers(context, path)
  }

  protected abstract getPath(context: Context): Path

  private drawMarkers(context: Context, path: Path): void {
    this.getMarkers(path).draw(context.clone({ transform: context.pdf.unitMatrix }))
  }

  protected fillOrStroke(context: Context): void {
    if (!context.withinClipPath) {
      const fill = context.attributeState.fill
      // pdf spec states: "A line width of 0 denotes the thinnest line that can be rendered at device resolution:
      // 1 device pixel wide". SVG, however, does not draw zero width lines.
      const stroke = context.attributeState.stroke && context.attributeState.strokeWidth !== 0

      const patternOrGradient = fill && fill.key ? fill : undefined
      const isNodeFillRuleEvenOdd = getAttribute(this.element, 'fill-rule') === 'evenodd'
      if (fill && stroke) {
        if (isNodeFillRuleEvenOdd) {
          context.pdf.fillStrokeEvenOdd(patternOrGradient)
        } else {
          context.pdf.fillStroke(patternOrGradient)
        }
      } else if (fill) {
        if (isNodeFillRuleEvenOdd) {
          context.pdf.fillEvenOdd(patternOrGradient)
        } else {
          context.pdf.fill(patternOrGradient)
        }
      } else if (stroke) {
        context.pdf.stroke()
      } else {
        context.pdf.discardPath()
      }
    }
  }

  protected getBoundingBoxCore(context: Context): Rect {
    const path = this.getPath(context)
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
    return addLineWidth([minX, minY, maxX - minX, maxY - minY], this.element)
  }

  protected getMarkers(path: Path): MarkerList {
    const marker = {
      start: getAttribute(this.element, 'marker-start'),
      mid: getAttribute(this.element, 'marker-mid'),
      end: getAttribute(this.element, 'marker-end')
    }
    const markers = new MarkerList()
    if (marker.start || marker.mid || marker.end) {
      marker.end && (marker.end = iriReference.exec(marker.end)[1])
      marker.start && (marker.start = iriReference.exec(marker.start)[1])
      marker.mid && (marker.mid = iriReference.exec(marker.mid)[1])

      const list = path.segments
      let prevAngle, curAngle, first: MoveTo, firstAngle, last: MoveTo | LineTo | CurveTo
      for (let i = 0; i < list.length; i++) {
        const curr = list[i]

        const hasStartMarker =
          marker.start &&
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
          marker.end &&
          (i === list.length - 1 || (!(list[i] instanceof MoveTo) && list[i + 1] instanceof MoveTo))
        const hasMidMarker = marker.mid && i > 0 && !(i === 1 && list[i - 1] instanceof MoveTo)

        const prev = list[i - 1] || null
        if (prev instanceof MoveTo || prev instanceof LineTo || prev instanceof CurveTo) {
          if (curr instanceof CurveTo) {
            hasStartMarker &&
              markers.addMarker(
                new Marker(
                  marker.start,
                  [prev.x, prev.y],
                  getAngle(last ? [last.x, last.y] : [prev.x, prev.y], [curr.x1, curr.y1])
                )
              )
            hasEndMarker &&
              markers.addMarker(
                new Marker(
                  marker.end,
                  [curr.x, curr.y],
                  getAngle([curr.x2, curr.y2], [curr.x, curr.y])
                )
              )
            if (hasMidMarker) {
              curAngle = getDirectionVector([prev.x, prev.y], [curr.x1, curr.y1])
              curAngle =
                prev instanceof SvgMoveTo ? curAngle : normalize(addVectors(prevAngle, curAngle))
              markers.addMarker(
                new Marker(marker.mid, [prev.x, prev.y], Math.atan2(curAngle[1], curAngle[0]))
              )
            }

            prevAngle = getDirectionVector([curr.x2, curr.y2], [curr.x, curr.y])
          } else if (curr instanceof MoveTo || curr instanceof LineTo) {
            curAngle = getDirectionVector([prev.x, prev.y], [curr.x, curr.y])
            if (hasStartMarker) {
              const angle = last ? getDirectionVector([last.x, last.y], [curr.x, curr.y]) : curAngle
              markers.addMarker(
                new Marker(marker.start, [prev.x, prev.y], Math.atan2(angle[1], angle[0]))
              )
            }
            hasEndMarker &&
              markers.addMarker(
                new Marker(marker.end, [curr.x, curr.y], Math.atan2(curAngle[1], curAngle[0]))
              )
            if (hasMidMarker) {
              const angle =
                curr instanceof MoveTo
                  ? prevAngle
                  : prev instanceof MoveTo
                  ? curAngle
                  : normalize(addVectors(prevAngle, curAngle))
              markers.addMarker(
                new Marker(marker.mid, [prev.x, prev.y], Math.atan2(angle[1], angle[0]))
              )
            }
            prevAngle = curAngle
          } else if (curr instanceof Close) {
            curAngle = getDirectionVector([prev.x, prev.y], [first.x, first.y])
            if (hasMidMarker) {
              const angle =
                prev instanceof MoveTo ? curAngle : normalize(addVectors(prevAngle, curAngle))
              markers.addMarker(
                new Marker(marker.mid, [prev.x, prev.y], Math.atan2(angle[1], angle[0]))
              )
            }
            if (hasEndMarker) {
              const angle = normalize(addVectors(curAngle, firstAngle))
              markers.addMarker(
                new Marker(marker.end, [first.x, first.y], Math.atan2(angle[1], angle[0]))
              )
            }
            prevAngle = curAngle
          }
        } else {
          first = curr instanceof MoveTo && curr
          const next = list[i + 1]
          if (next instanceof MoveTo || next instanceof LineTo || next instanceof CurveTo) {
            firstAngle = getDirectionVector([first.x, first.y], [next.x, next.y])
          }
        }
      }
    }
    return markers
  }
}
