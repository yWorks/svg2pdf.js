import { SvgNode } from './svgnode'
import { Context } from '../context/context'
import { defaultBoundingBox, addLineWidth } from '../utils/bbox'
import { ReferencesHandler } from '../context/referenceshandler'
import { parse } from '../parse'
import { getAttribute, svgNodeIsVisible } from '../utils/node'
import { GraphicsNode } from './graphicsnode'
import { Rect } from '../utils/geometry'

// groups: 1: mime-type (+ charset), 2: mime-type (w/o charset), 3: charset, 4: base64?, 5: body
export const dataUriRegex = /^\s*data:(([^/,;]+\/[^/,;]+)(?:;([^,;=]+=[^,;=]+))?)?(?:;(base64))?,(.*\s*)$/i

export class ImageNode extends GraphicsNode {
  protected async renderCore(context: Context): Promise<void> {
    context.pdf.setCurrentTransformationMatrix(context.transform)
    const width = parseFloat(getAttribute(this.element, 'width')),
      height = parseFloat(getAttribute(this.element, 'height')),
      x = parseFloat(getAttribute(this.element, 'x')) || 0,
      y = parseFloat(getAttribute(this.element, 'y')) || 0

    if (!isFinite(width) || width <= 0 || !isFinite(height) || height <= 0) {
      return
    }

    const imageUrl = this.element.getAttribute('xlink:href') || this.element.getAttribute('href')

    if (!imageUrl) {
      return
    }

    const dataUrl = imageUrl.match(dataUriRegex)
    if (dataUrl && dataUrl[2] === 'image/svg+xml') {
      let svgText = dataUrl[5]
      if (dataUrl[4] === 'base64') {
        svgText = atob(svgText)
      } else {
        svgText = decodeURIComponent(svgText)
      }

      const parser = new DOMParser()
      const svgElement = parser.parseFromString(svgText, 'image/svg+xml')
        .firstElementChild as HTMLElement

      // unless preserveAspectRatio starts with "defer", the preserveAspectRatio attribute of the svg is ignored
      const preserveAspectRatio = this.element.getAttribute('preserveAspectRatio')
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

      const idMap: { [id: string]: SvgNode } = {}
      const svgnode = parse(svgElement, idMap)
      await svgnode.render(
        new Context(context.pdf, {
          refsHandler: new ReferencesHandler(idMap)
        })
      )
      return
    }

    try {
      context.pdf.addImage(
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
  protected getBoundingBoxCore(context: Context): Rect {
    return addLineWidth(defaultBoundingBox(this.element), this.element)
  }

  computeNodeTransformCore(context: Context): any {
    return context.pdf.unitMatrix
  }

  isVisible(parentVisible: boolean): boolean {
    return svgNodeIsVisible(this, parentVisible)
  }
}
