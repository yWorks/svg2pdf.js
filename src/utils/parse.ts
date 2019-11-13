import Group from '../nodest/group'
import NodeStructureTree from '../nodest/nst'
import Line from '../nodest/line'
import Use from '../nodest/use'
import Rect from '../nodest/rect'
import Ellipse from '../nodest/ellipse'
import TextAst from '../nodest/text'
import Path from '../nodest/path'
import ImageNST from '../nodest/image'
import Polygon from '../nodest/polygon'
import { forEachChild } from './node'
import DefaultNST from '../nodest/default'
import MarkerNST from '../nodest/marker'

export default function parse(node: HTMLElement): NodeStructureTree {
  let svgnode: NodeStructureTree
  const children: NodeStructureTree[] = []

  forEachChild(node, (i, n) => children.push(parse(n)))

  switch (node.tagName.toLowerCase()) {
    case 'a':
    case 'g':
    case 'svg':
      svgnode = new Group(node, children)
      break
    case 'circle':
      svgnode = new Ellipse(node, children, 'circle')
      break
    case 'ellipse':
      svgnode = new Ellipse(node, children)
      break
    case 'image':
      svgnode = new ImageNST(node, children)
      break
    case 'line':
      svgnode = new Line(node, children)
      break
    case 'marker':
      svgnode = new MarkerNST(node, children)
      break
    case 'path':
      svgnode = new Path(node, children)
      break
    case 'polygon':
    case 'polyline':
      svgnode = new Polygon(node, children)
      break
    case 'rect':
      svgnode = new Rect(node, children)
      break
    case 'text':
      svgnode = new TextAst(node, children)
      break
    case 'use':
      svgnode = new Use(node, children)
      break
    default:
      svgnode = new DefaultNST(node, children)
      break
  }
  svgnode.children.forEach(child => (child.parent = svgnode))

  return svgnode
}
