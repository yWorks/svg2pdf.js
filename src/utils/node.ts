export function nodeIs(node: HTMLElement, tagsString: string) {
  return tagsString.split(',').indexOf(node.tagName.toLowerCase()) >= 0
}

export function forEachChild(node: HTMLElement, fn: (n: number, e: HTMLElement) => void) {
  // copy list of children, as the original might be modified
  var children = []
  for (var i = 0; i < node.childNodes.length; i++) {
    var childNode = node.childNodes[i]
    if (childNode.nodeName.charAt(0) !== '#') children.push(childNode)
  }
  for (i = 0; i < children.length; i++) {
    fn(i, children[i] as HTMLElement)
  }
}

// returns an attribute of a node, either from the node directly or from css
export function getAttribute(node: HTMLElement, propertyNode: string, propertyCss?: string) {
  propertyCss = propertyCss || propertyNode
  var attribute = node.style.getPropertyValue(propertyCss)
  if (attribute) {
    return attribute
  } else if (node.hasAttribute(propertyNode)) {
    return node.getAttribute(propertyNode)
  } else {
    return void 0
  }
}

export function isPartlyVisible(node: HTMLElement, parentHidden?: boolean) {
  if (getAttribute(node, 'display') === 'none') {
    return false
  }

  var visible = !parentHidden

  var visibility = getAttribute(node, 'visibility')
  if (visibility) {
    visible = visibility !== 'hidden'
  }

  if (nodeIs(node, 'svg,g,marker,a,pattern,defs,text,clippath')) {
    var hasChildren = false
    forEachChild(node, function(i, child) {
      hasChildren = true
      if (isPartlyVisible(child, !visible)) {
        visible = true
      }
    })
    if (!hasChildren) {
      return false
    }
  }

  return visible
}
