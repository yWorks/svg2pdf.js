import NodeStructureTree from './nst'
import Context from '../context/context'
import { parseFloats } from '../utils/math'
import { computeViewBoxTransform } from '../utils/transform'

export default class MarkerNST extends NodeStructureTree {
  render(context: Context): void {
    this.children.forEach(child =>
      child.render(
        new Context(context._pdf, {
          refsHandler: this,
          transform: child.computeNodeTransform(context)
        })
      )
    )
  }
  renderCore(): void {}

  getBoundingBoxCore(context: Context): number[] {
    var viewBox = this.element.getAttribute('viewBox'),
      vb
    if (viewBox) {
      vb = parseFloats(viewBox)
    }
    return [
      (vb && vb[0]) || 0,
      (vb && vb[1]) || 0,
      (vb && vb[2]) || parseFloat(this.element.getAttribute('marker-width')) || 0,
      (vb && vb[3]) || parseFloat(this.element.getAttribute('marker-height')) || 0
    ]
  }

  computeNodeTransformCore(context: Context): any {
    var x = parseFloat(this.element.getAttribute('refX')) || 0
    var y = parseFloat(this.element.getAttribute('refY')) || 0

    var viewBox = this.element.getAttribute('viewBox')
    if (viewBox) {
      var bounds = parseFloats(viewBox)
      bounds[0] = bounds[1] = 0 // for some reason vbX anc vbY seem to be ignored for markers
      var nodeTransform = computeViewBoxTransform(
        this.element,
        bounds,
        0,
        0,
        parseFloat(this.element.getAttribute('markerWidth')) || 3,
        parseFloat(this.element.getAttribute('markerHeight')) || 3,
        context
      )
      nodeTransform = context._pdf.matrixMult(
        new context._pdf.Matrix(1, 0, 0, 1, -x, -y),
        nodeTransform
      )
    } else {
      var nodeTransform = new context._pdf.Matrix(1, 0, 0, 1, -x, -y)
    }
    return nodeTransform
  }
}
