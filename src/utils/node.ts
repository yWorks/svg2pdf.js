import { SvgNode } from '../nodes/svgnode'
import { Context } from '../context/context'
import { StyleSheets } from '../context/stylesheets'

export function nodeIs(node: Element, tagsString: string): boolean {
  return tagsString.split(',').indexOf((node.nodeName || node.tagName).toLowerCase()) >= 0
}

export function forEachChild(node: Element, fn: (n: number, e: Element) => void): void {
  // copy list of children, as the original might be modified
  const children = []
  for (let i = 0; i < node.childNodes.length; i++) {
    const childNode = node.childNodes[i]
    if (childNode.nodeName.charAt(0) !== '#') children.push(childNode)
  }
  for (let i = 0; i < children.length; i++) {
    fn(i, children[i] as Element)
  }
}

// returns an attribute of a node, either from the node directly or from css
export function getAttribute(
  node: Element,
  styleSheets: StyleSheets,
  propertyNode: string,
  propertyCss = propertyNode
): string | undefined {
  const attribute = (node as SVGElement).style.getPropertyValue(propertyCss)
  if (attribute) {
    return attribute
  } else {
    const propertyValue = styleSheets.getPropertyValue(node, propertyCss)
    if (propertyValue) {
      return propertyValue
    } else if (node.hasAttribute(propertyNode)) {
      return node.getAttribute(propertyNode) || undefined
    } else {
      return undefined
    }
  }
}

export function svgNodeIsVisible(
  svgNode: SvgNode,
  parentVisible: boolean,
  context: Context
): boolean {
  if (getAttribute(svgNode.element, context.styleSheets, 'display') === 'none') {
    return false
  }

  let visible = parentVisible

  const visibility = getAttribute(svgNode.element, context.styleSheets, 'visibility')
  if (visibility) {
    visible = visibility !== 'hidden'
  }

  return visible
}

export function svgNodeAndChildrenVisible(
  svgNode: SvgNode,
  parentVisible: boolean,
  context: Context
): boolean {
  let visible = svgNodeIsVisible(svgNode, parentVisible, context)
  if (svgNode.element.childNodes.length === 0) {
    return false
  }
  svgNode.children.forEach(child => {
    if (child.isVisible(visible, context)) {
      visible = true
    }
  })

  return visible
}
