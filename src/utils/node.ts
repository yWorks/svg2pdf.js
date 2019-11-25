import { Context } from '../context/context'
import { SvgNode } from '../nodes/svgnode'

export function nodeIs(node: HTMLElement, tagsString: string) {
  return node.tagName && tagsString.split(',').indexOf(node.tagName.toLowerCase()) >= 0
}

export function nodeIsChildOf(node: HTMLElement, tagString: string) {
  const root = (node as any).ownerSVGElement
  if (!root) {
    return false
  }
  for (let tmp: any = node.parentNode; tmp !== root; tmp = tmp.parentNode) {
    if (nodeIs(tmp, tagString)) {
      return true
    }
  }
  return false
}

export function refIsSymbol(node: HTMLElement, context: Context) {
  var id = node.getAttribute('href') || node.getAttribute('xlink:href')
  if (!id) {
    return false
  }
  var refNode = context.refsHandler.get(id.substring(1))
  if (!refNode) {
    return false
  }
  return nodeIs(refNode.element, 'symbol')
}

export function forEachChild(node: HTMLElement, fn: (n: number, e: HTMLElement) => void) {
  // copy list of children, as the original might be modified
  const children = []
  for (let i = 0; i < node.childNodes.length; i++) {
    const childNode = node.childNodes[i]
    if (childNode.nodeName.charAt(0) !== '#') children.push(childNode)
  }
  for (let i = 0; i < children.length; i++) {
    fn(i, children[i] as HTMLElement)
  }
}

// returns an attribute of a node, either from the node directly or from css
export function getAttribute(node: HTMLElement, propertyNode: string, propertyCss?: string) {
  propertyCss = propertyCss || propertyNode
  const attribute = node.style.getPropertyValue(propertyCss)
  if (attribute) {
    return attribute
  } else if (node.hasAttribute(propertyNode)) {
    return node.getAttribute(propertyNode)
  } else {
    return void 0
  }
}

export function svgNodeIsVisible(svgNode: SvgNode, parentVisible: boolean) {
  if (getAttribute(svgNode.element, 'display') === 'none') {
    return false
  }

  let visible = parentVisible

  const visibility = getAttribute(svgNode.element, 'visibility')
  if (visibility) {
    visible = visibility !== 'hidden'
  }

  return visible
}

export function svgNodeAndChildrenVisible(svgNode: SvgNode, parentVisible: boolean) {
  let visible = svgNodeIsVisible(svgNode, parentVisible)
  if (svgNode.element.childNodes.length === 0) {
    return false
  }
  svgNode.children.forEach(child => {
    if (child.isVisible(visible)) {
      visible = true
    }
  })

  return visible
}
