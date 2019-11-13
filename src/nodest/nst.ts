import Context from '../context/context'
import { iriReference } from '../utils/constants'
import RGBColor from '../utils/rgbcolor'
import { parseFloats } from '../utils/math'
import { setTextProperties, putTextProperties } from '../utils/text'
import parse from '../utils/parse'
import { nodeIs, getAttribute, isPartlyVisible } from '../utils/node'
import { computeNodeTransform, parseTransform } from '../utils/transform'
import { getFill } from '../utils/misc'

export default abstract class NodeStructureTree {
  element: HTMLElement
  parent: NodeStructureTree
  children: NodeStructureTree[]

  constructor(element: HTMLElement, children: NodeStructureTree[]) {
    this.element = element
    this.children = children
    this.parent = null
  }
  protected abstract getBoundingBoxCore(context: Context): number[]
  getBBox(context: Context): number[] {
    if (getAttribute(this.element, 'display') === 'none') {
      return [0, 0, 0, 0]
    }
    return this.getBoundingBoxCore(context)
  }

  protected abstract computeNodeTransformCore(context: Context): any
  computeNodeTransform(context: Context): any {
    var nodeTransform = this.computeNodeTransformCore(context)
    var transformString = getAttribute(this.element, 'transform')
    if (!transformString) return nodeTransform
    else return context._pdf.matrixMult(nodeTransform, parseTransform(transformString, context))
  }

  protected abstract renderCore(context: Context): void
  render(context: Context) {
    //alert('hey')
    if (nodeIs(this.element, 'defs,clippath,pattern,lineargradient,radialgradient,marker')) {
      // we will only render them on demand
      return
    }
    if (getAttribute(this.element, 'display') === 'none') {
      return
    }

    var parentContext = context
    var context = this.parseAttributes(parentContext.clone())
    if (!context) {
      return
    }

    if (!this.clip(context, 'open')) {
      return
    }

    if (!this.applyAttributes(context, parentContext)) {
      return
    }

    this.renderCore(context)

    this.fillOrStroke(context, parentContext)

    if (!context.withinClipPath) {
      context._pdf.restoreGraphicsState()
    }

    this.clip(context, 'close')
  }

  protected fillOrStroke(childContext: Context, parentContext: Context) {
    if (
      nodeIs(this.element, 'path,rect,ellipse,circle,polygon,polyline') &&
      !childContext.withinClipPath
    ) {
      var fill = childContext.attributeState.fill
      // pdf spec states: "A line width of 0 denotes the thinnest line that can be rendered at device resolution:
      // 1 device pixel wide". SVG, however, does not draw zero width lines.
      var stroke =
        childContext.attributeState.stroke && childContext.attributeState.strokeWidth !== 0

      var patternOrGradient = fill && fill.key ? fill : undefined
      var isNodeFillRuleEvenOdd = getAttribute(this.element, 'fill-rule') === 'evenodd'
      if (fill && stroke) {
        if (isNodeFillRuleEvenOdd) {
          childContext._pdf.fillStrokeEvenOdd(patternOrGradient)
        } else {
          childContext._pdf.fillStroke(patternOrGradient)
        }
      } else if (fill) {
        if (isNodeFillRuleEvenOdd) {
          childContext._pdf.fillEvenOdd(patternOrGradient)
        } else {
          childContext._pdf.fill(patternOrGradient)
        }
      } else if (stroke) {
        childContext._pdf.stroke()
      } else {
        childContext._pdf.discardPath()
      }
    }
  }

  protected parseAttributes(context: Context): Context {
    var visibility = getAttribute(this.element, 'visibility')
    if (visibility) {
      context.attributeState.visibility = visibility
    }

    /* // Set the correct transformation
    context.transform = context._pdf.matrixMult(
      computeNodeTransform(this.element, context),
      context.transform
    ) */

    if (nodeIs(this.element, 'svg,g,path,rect,text,ellipse,line,circle,polygon,polyline')) {
      // fill mode
      var fillColor = getAttribute(this.element, 'fill')
      if (fillColor) {
        context.attributeState.fill = getFill(fillColor, context, this.element)
      } else {
        context.attributeState.fill = 'inherit'
      }

      // opacity is realized via a pdf graphics state
      context.attributeState.fillOpacity = parseFloat(
        getAttribute(this.element, 'fill-opacity') || '1'
      )
      context.attributeState.strokeOpacity = parseFloat(
        getAttribute(this.element, 'stroke-opacity') || '1'
      )
      context.attributeState.opacity = parseFloat(getAttribute(this.element, 'opacity') || '1')

      // stroke mode
      var strokeWidth: any = getAttribute(this.element, 'stroke-width')
      if (strokeWidth !== void 0 && strokeWidth !== '') {
        strokeWidth = Math.abs(parseFloat(strokeWidth))
        context.attributeState.strokeWidth = strokeWidth
      } else {
        // needed for inherited zero width strokes
        strokeWidth = context.attributeState.strokeWidth
      }

      var strokeColor = getAttribute(this.element, 'stroke')
      if (strokeColor) {
        if (strokeColor === 'none') {
          context.attributeState.stroke = null
        } else {
          var strokeRGB = new RGBColor(strokeColor)
          if (strokeRGB.ok) {
            context.attributeState.stroke = strokeRGB
          }
        }
      }

      var lineCap = getAttribute(this.element, 'stroke-linecap')
      if (lineCap) {
        context.attributeState.strokeLinecap = lineCap
      }
      var lineJoin = getAttribute(this.element, 'stroke-linejoin')
      if (lineJoin) {
        context.attributeState.strokeLinejoin = lineJoin
      }
      var dashArray: any = getAttribute(this.element, 'stroke-dasharray')
      if (dashArray) {
        dashArray = parseFloats(dashArray)
        var dashOffset = parseInt(getAttribute(this.element, 'stroke-dashoffset')) || 0
        context.attributeState.strokeDasharray = dashArray
        context.attributeState.strokeDashoffset = dashOffset
      }
      var miterLimit = getAttribute(this.element, 'stroke-miterlimit')
      if (miterLimit !== void 0 && miterLimit !== '') {
        context.attributeState.strokeMiterlimit = parseFloat(miterLimit)
      }
    }

    var xmlSpace = this.element.getAttribute('xml:space')
    if (xmlSpace) {
      context.attributeState.xmlSpace = xmlSpace
    }

    setTextProperties(this.element, null, context)

    return context
  }

  protected applyAttributes(childContext: Context, parentContext: Context): boolean {
    if (
      childContext.attributeState.visibility === 'hidden' &&
      !nodeIs(this.element, 'svg,g,marker,a,pattern,defs,text')
    ) {
      return false
    }

    if (!childContext.withinClipPath) {
      childContext._pdf.saveGraphicsState()
    }

    var fillOpacity = 1.0,
      strokeOpacity = 1.0

    fillOpacity *= childContext.attributeState.fillOpacity
    if (
      childContext.attributeState.fill instanceof RGBColor &&
      typeof childContext.attributeState.fill.a === 'number'
    ) {
      fillOpacity *= childContext.attributeState.fill.a
    }
    fillOpacity *= childContext.attributeState.opacity

    strokeOpacity *= childContext.attributeState.strokeOpacity
    if (
      childContext.attributeState.stroke instanceof RGBColor &&
      typeof childContext.attributeState.stroke.a === 'number'
    ) {
      strokeOpacity *= childContext.attributeState.stroke.a
    }
    strokeOpacity *= childContext.attributeState.opacity

    var hasFillOpacity = fillOpacity < 1.0
    var hasStrokeOpacity = strokeOpacity < 1.0
    if (hasFillOpacity || hasStrokeOpacity) {
      var gState: any = {}
      hasFillOpacity && (gState['opacity'] = fillOpacity)
      hasStrokeOpacity && (gState['stroke-opacity'] = strokeOpacity)
      childContext._pdf.setGState(new childContext._pdf.GState(gState))
    }

    if (
      childContext.attributeState.fill instanceof RGBColor &&
      childContext.attributeState.fill !== parentContext.attributeState.fill &&
      !nodeIs(this.element, 'text')
    ) {
      // text fill color will be applied through setTextColor()
      childContext._pdf.setFillColor(
        childContext.attributeState.fill.r,
        childContext.attributeState.fill.g,
        childContext.attributeState.fill.b
      )
    } else if (childContext.attributeState.fill === 'inherit') {
      childContext.attributeState.fill = parentContext.attributeState.fill
    }

    if (childContext.attributeState.strokeWidth !== parentContext.attributeState.strokeWidth) {
      childContext._pdf.setLineWidth(childContext.attributeState.strokeWidth)
    }

    if (childContext.attributeState.stroke !== parentContext.attributeState.stroke) {
      childContext._pdf.setDrawColor(
        childContext.attributeState.stroke.r,
        childContext.attributeState.stroke.g,
        childContext.attributeState.stroke.b
      )
    } else if (childContext.attributeState.stroke === 'inherit') {
      childContext.attributeState.stroke = parentContext.attributeState.stroke
    }

    if (childContext.attributeState.strokeLinecap !== parentContext.attributeState.strokeLinecap) {
      childContext._pdf.setLineCap(childContext.attributeState.strokeLinecap)
    }

    if (
      childContext.attributeState.strokeLinejoin !== parentContext.attributeState.strokeLinejoin
    ) {
      childContext._pdf.setLineJoin(childContext.attributeState.strokeLinejoin)
    }

    if (
      childContext.attributeState.strokeDasharray !==
        parentContext.attributeState.strokeDasharray ||
      childContext.attributeState.strokeDashoffset !== parentContext.attributeState.strokeDashoffset
    ) {
      childContext._pdf.setLineDashPattern(
        childContext.attributeState.strokeDasharray,
        childContext.attributeState.strokeDashoffset
      )
    }

    if (
      childContext.attributeState.strokeMiterlimit !== parentContext.attributeState.strokeMiterlimit
    ) {
      childContext._pdf.setLineMiterLimit(childContext.attributeState.strokeMiterlimit)
    }

    putTextProperties(childContext.attributeState, parentContext.attributeState, childContext)
    return true
  }

  protected clip(context: Context, openOrClose: string): boolean {
    var hasClipPath =
      this.element.hasAttribute('clip-path') && getAttribute(this.element, 'clip-path') !== 'none'
    if (hasClipPath) {
      if (openOrClose === 'open') {
        var clipPathId = iriReference.exec(getAttribute(this.element, 'clip-path'))
        var clipPathNode = context.refsHandler.getRendered(clipPathId[1], context)

        if (!isPartlyVisible(clipPathNode)) {
          //context._pdf.restoreGraphicsState()
          return false
        }

        var clipPathMatrix = context.transform
        if (
          clipPathNode.hasAttribute('clipPathUnits') &&
          clipPathNode.getAttribute('clipPathUnits').toLowerCase() === 'objectboundingbox'
        ) {
          var bBox = this.getBBox(context)
          clipPathMatrix = context._pdf.matrixMult(
            new context._pdf.Matrix(bBox[2], 0, 0, bBox[3], bBox[0], bBox[1]),
            clipPathMatrix
          )
        }

        // here, browsers show different results for a "transform" attribute on the clipPath element itself:
        // IE/Edge considers it, Chrome and Firefox ignore it. However, the specification lists "transform" as a valid
        // attribute for clipPath elements, although not explicitly explaining its behavior. This implementation follows
        // IE/Edge and considers the "transform" attribute as additional transformation within the coordinate system
        // established by the "clipPathUnits" attribute.
        clipPathMatrix = context._pdf.matrixMult(
          computeNodeTransform(clipPathNode, context),
          clipPathMatrix
        )

        context._pdf.saveGraphicsState()
        context._pdf.setCurrentTransformationMatrix(clipPathMatrix)

        parse(clipPathNode).children.forEach(child =>
          child.render(
            new Context(context._pdf, {
              refsHandler: context.refsHandler,
              transform: child.computeNodeTransform(context),
              withinClipPath: true
            })
          )
        )
        context._pdf.clip().discardPath()

        // as we cannot use restoreGraphicsState() to reset the transform (this would reset the clipping path, as well),
        // we must append the inverse instead
        context._pdf.setCurrentTransformationMatrix(clipPathMatrix.inversed())
      } else if (openOrClose === 'close') {
        context._pdf.restoreGraphicsState()
      }
    }
    return true
  }
}
