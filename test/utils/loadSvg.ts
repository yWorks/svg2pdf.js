export async function loadSvg(path: string): Promise<{
  svgElement: SVGSVGElement
  width: number
  height: number
}> {
  const svgText = await fetch(path).then(r => r.text())
  const parser = new DOMParser()
  const svgElement = parser.parseFromString(svgText, 'image/svg+xml')
    .firstElementChild as SVGSVGElement

  const width = svgElement.width.baseVal.value
  const height = svgElement.height.baseVal.value

  return { svgElement, width, height }
}
