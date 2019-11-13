import NodeStructureTree from './nst'
import Context from '../context/context'
import { defaultBoundingBox, addLineWidth } from '../utils/bbox'
import { dataUrlRegex } from '../utils/constants'
import ReferencesHandler from '../context/referenceshandler'
import parse from '../utils/parse'
import { getAttribute } from '../utils/node'

export default class ImageNST extends NodeStructureTree {
  renderCore(context: Context): void {
    context._pdf.setCurrentTransformationMatrix(context.transform)
    var width = parseFloat(getAttribute(this.element, 'width')),
      height = parseFloat(getAttribute(this.element, 'height')),
      x = parseFloat(getAttribute(this.element, 'x')) || 0,
      y = parseFloat(getAttribute(this.element, 'y')) || 0

    if (!isFinite(width) || width <= 0 || !isFinite(height) || height <= 0) {
      return
    }

    var imageUrl = this.element.getAttribute('xlink:href') || this.element.getAttribute('href')

    if (!imageUrl) {
      return
    }

    var dataUrl = imageUrl.match(dataUrlRegex)
    if (dataUrl && dataUrl[2] === 'image/svg+xml') {
      var svgText = dataUrl[5]
      if (dataUrl[4] === 'base64') {
        svgText = atob(svgText)
      } else {
        svgText = decodeURIComponent(svgText)
      }

      var parser = new DOMParser()
      var svgElement = parser.parseFromString(svgText, 'image/svg+xml')
        .firstElementChild as HTMLElement

      // unless preserveAspectRatio starts with "defer", the preserveAspectRatio attribute of the svg is ignored
      var preserveAspectRatio = this.element.getAttribute('preserveAspectRatio')
      if (
        !preserveAspectRatio ||
        preserveAspectRatio.indexOf('defer') < 0 ||
        !svgElement.getAttribute('preserveAspectRatio')
      ) {
        svgElement.setAttribute('preserveAspectRatio', preserveAspectRatio)
      }

      svgElement.setAttribute('x', String(x))
      svgElement.setAttribute('y', String(y))
      svgElement.setAttribute('width', String(width))
      svgElement.setAttribute('height', String(height))

      var svgNST = parse(svgElement)
      svgNST.render(
        new Context(context._pdf, {
          refsHandler: new ReferencesHandler(svgElement),
          transform: svgNST.computeNodeTransform(context)
        })
      )
      return
    }

    try {
      context._pdf.addImage(
        imageUrl,
        '', // will be ignored anyways if imageUrl is a data url
        x,
        y,
        width,
        height
      )
    } catch (e) {
      typeof console === 'object' &&
        console.warn &&
        console.warn(
          'svg2pdfjs: Images with external resource link are not supported! ("' + imageUrl + '")'
        )
    }
  }
  getBoundingBoxCore(context: Context): number[] {
    return addLineWidth(defaultBoundingBox(this.element, context), this.element)
  }

  computeNodeTransformCore(context: Context): any {
    return context._pdf.unitMatrix
  }
}
