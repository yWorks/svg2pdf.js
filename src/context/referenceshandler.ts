import cssEsc from 'cssesc'

import AttributeState from './attributestate'
import Context from './context'
import parse from '../utils/parse'
import { nodeIs } from '../utils/node'
import { pattern, putGradient } from '../utils/patterngradient'

/**
 * @constructor
 * @param {Element} rootSvg
 * @property {Object.<String,Element>} renderedElements
 * @property {Element} rootSvg
 */
export default class ReferencesHandler {
  private renderedElements: any
  private rootSvg: HTMLElement

  constructor(rootSvg: HTMLElement) {
    this.renderedElements = {}
    this.rootSvg = rootSvg
  }

  /**
   * @param {string} id
   * @return {*}
   */
  getRendered(id: string, context: Context) {
    if (this.renderedElements.hasOwnProperty(id)) {
      return this.renderedElements[id]
    }

    var node: HTMLElement = this.rootSvg.querySelector('#' + cssEsc(id, { isIdentifier: true }))
    var nst = parse(node)

    if (nodeIs(node, 'lineargradient')) {
      putGradient(
        node,
        'axial',
        [
          node.getAttribute('x1') || 0,
          node.getAttribute('y1') || 0,
          node.getAttribute('x2') || 1,
          node.getAttribute('y2') || 0
        ],
        context
      )
    } else if (nodeIs(node, 'radialgradient')) {
      putGradient(
        node,
        'radial',
        [
          node.getAttribute('fx') || node.getAttribute('cx') || 0.5,
          node.getAttribute('fy') || node.getAttribute('cy') || 0.5,
          0,
          node.getAttribute('cx') || 0.5,
          node.getAttribute('cy') || 0.5,
          node.getAttribute('r') || 0.5
        ],
        context
      )
    } else if (nodeIs(node, 'pattern')) {
      pattern(node, this, AttributeState.default(), context)
    } else if (nodeIs(node, 'marker')) {
      // the transformations directly at the node are written to the pdf form object transformation matrix
      var tfMatrix = nst.computeNodeTransform(context)
      var bBox = nst.getBBox(context)

      context._pdf.beginFormObject(bBox[0], bBox[1], bBox[2], bBox[3], tfMatrix)
      nst.render(
        new Context(context._pdf, {
          refsHandler: this,
          transform: tfMatrix
        })
      )
      context._pdf.endFormObject(node.getAttribute('id'))
    } else if (!nodeIs(node, 'clippath')) {
      // the transformations directly at the node are written to the pdf form object transformation matrix
      var childContext = new Context(context._pdf, { refsHandler: this })
      var tfMatrix = nst.computeNodeTransform(childContext)
      var bBox = nst.getBBox(context)

      context._pdf.beginFormObject(bBox[0], bBox[1], bBox[2], bBox[3], tfMatrix)
      nst.render(childContext)
      context._pdf.endFormObject(node.getAttribute('id'))
    }

    this.renderedElements[id] = node
    return node
  }
}
