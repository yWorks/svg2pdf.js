import { SvgNode } from './nodes/svgnode'
import { Line } from './nodes/line'
import { Use } from './nodes/use'
import { Rect } from './nodes/rect'
import { Ellipse } from './nodes/ellipse'
import { TextNode } from './nodes/text'
import { Path } from './nodes/path'
import { ImageNode } from './nodes/image'
import { Polygon } from './nodes/polygon'
import { forEachChild } from './utils/node'
import { VoidNode } from './nodes/void'
import { MarkerNode } from './nodes/marker'
import { Pattern } from './nodes/pattern'
import { Circle } from './nodes/circle'
import { LinearGradient } from './nodes/lineargradient'
import { RadialGradient } from './nodes/radialgradient'
import { Polyline } from './nodes/polyline'
import { Svg } from './nodes/svg'
import { Group } from './nodes/group'
import cssesc from 'cssesc'
import { ClipPath } from './nodes/clippath'

export function parse(node: HTMLElement, idMap?: { [id: string]: SvgNode }): SvgNode {
  let svgnode: SvgNode
  const children: SvgNode[] = []
  const existsIdMap = idMap || idMap === {}

  if (existsIdMap) {
    forEachChild(node, (i, n) => children.push(parse(n, idMap)))
  } else {
    forEachChild(node, (i, n) => children.push(parse(n)))
  }

  switch (node.tagName.toLowerCase()) {
    case 'a':
    case 'g':
      svgnode = new Group(node, children)
      break
    case 'circle':
      svgnode = new Circle(node, children)
      break
    case 'clippath':
      svgnode = new ClipPath(node, children)
      break
    case 'ellipse':
      svgnode = new Ellipse(node, children)
      break
    case 'lineargradient':
      svgnode = new LinearGradient(node, children)
      break
    case 'image':
      svgnode = new ImageNode(node, children)
      break
    case 'line':
      svgnode = new Line(node, children)
      break
    case 'marker':
      svgnode = new MarkerNode(node, children)
      break
    case 'path':
      svgnode = new Path(node, children)
      break
    case 'pattern':
      svgnode = new Pattern(node, children)
      break
    case 'polygon':
      svgnode = new Polygon(node, children)
      break
    case 'polyline':
      svgnode = new Polyline(node, children)
      break
    case 'radialgradient':
      svgnode = new RadialGradient(node, children)
      break
    case 'rect':
      svgnode = new Rect(node, children)
      break
    case 'svg':
      svgnode = new Svg(node, children)
      break
    case 'text':
      svgnode = new TextNode(node, children)
      break
    case 'use':
      svgnode = new Use(node, children)
      break
    default:
      svgnode = new VoidNode(node, children)
      break
  }

  svgnode.children.forEach(child => (child.parent = svgnode))

  if (existsIdMap && svgnode.element.hasAttribute('id')) {
    const id = cssesc(svgnode.element.id, { isIdentifier: true })
    idMap[id] = idMap[id] || svgnode
  }

  return svgnode
}
