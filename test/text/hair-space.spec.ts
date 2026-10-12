import { describe, expect, it, vi } from 'vitest'
import jsPDF from 'jspdf'
import { svg2pdf } from '../../src/svg2pdf'

const hairSpace = '\u200a'
const fontFamily = 'courier'
const fontSize = 20
const namespace = 'http://www.w3.org/2000/svg'

interface TextCall {
  text: string
  x: number
  y: number
  charSpace: number
}

function text(contents: string, y = 40, attributes = ''): string {
  return `<text x="20" y="${y}" ${attributes}>${contents}</text>`
}

function attachSvg(contents: string): SVGSVGElement {
  const documentNode = new DOMParser().parseFromString(
    `<svg xmlns="${namespace}" width="400" height="280" ` +
      `font-family="${fontFamily}" font-size="${fontSize}">${contents}</svg>`,
    'image/svg+xml'
  )
  if (documentNode.querySelector('parsererror')) throw new Error('Invalid test SVG')
  const svg = documentNode.documentElement as unknown as SVGSVGElement
  svg.style.position = 'absolute'
  svg.style.left = '-10000px'
  document.body.appendChild(svg)
  return svg
}

async function render(contents: string): Promise<TextCall[]> {
  const pdf = new jsPDF('landscape', 'pt', [400, 280])
  const calls: TextCall[] = []
  const originalText = pdf.text.bind(pdf)
  const textSpy = vi.spyOn(pdf, 'text').mockImplementation((...args) => {
    if (typeof args[0] !== 'string') throw new Error('Expected string text in the fixture')
    calls.push({
      text: args[0],
      x: args[1],
      y: args[2],
      charSpace: args[3]?.charSpace || 0
    })
    return originalText(...args)
  })
  let svg: SVGSVGElement | undefined
  try {
    svg = attachSvg(contents)
    await svg2pdf(svg, pdf)
    return calls
  } finally {
    textSpy.mockRestore()
    svg?.remove()
  }
}

async function preservedAdvance(value: string): Promise<number> {
  // Preserve mode bypasses normalization while retaining the renderer's font measurement strategy.
  const calls = await render(
    text(`<tspan>${value}</tspan><tspan>M</tspan>`, 40, 'xml:space="preserve"')
  )
  expect(calls.map(call => call.text)).toEqual([value, 'M'])
  return calls[1].x - calls[0].x
}

function row(calls: TextCall[], y: number): TextCall[] {
  return calls.filter(call => call.y === y)
}

describe('hair spaces', () => {
  it('retains leading, trailing, and all-only hair spaces in plain text', async () => {
    const expected = [hairSpace + 'M' + hairSpace, hairSpace + hairSpace]
    const calls = await render(
      text(expected[0], 40) + text(expected[1], 80) + text('  ' + expected[0] + '  ', 120)
    )
    expect(calls.map(call => call.text)).toEqual([...expected, expected[0]])
  })

  it.each([
    [
      'adjacent',
      `<tspan dx="7">${hairSpace}</tspan><tspan dx="5">${hairSpace}</tspan>` +
        '<tspan dx="3">M</tspan>'
    ],
    [
      'nested',
      `<tspan dx="7"><tspan>${hairSpace}</tspan></tspan>` +
        `<tspan dx="5"><tspan>${hairSpace}</tspan><tspan dx="3">M</tspan></tspan>`
    ]
  ] as const)('advances following text after %s spacer spans', async (_, spans) => {
    const advance = await preservedAdvance(hairSpace)
    expect(advance, 'preserved hair-space advance').toBeGreaterThan(0)
    const calls = await render(text(spans))
    expect.soft(calls.map(call => call.text)).toEqual([hairSpace, hairSpace, 'M'])
    expect.soft(calls.map(call => call.x)).toHaveLength(3)
    const expectedX = [27, 32 + advance, 35 + 2 * advance]
    calls.forEach((call, i) => expect.soft(call.x).toBeCloseTo(expectedX[i], 5))
    const shifted = await render(text(spans.replace('dx="7"', 'dx="18"')))
    expect.soft(shifted.map(call => call.text)).toEqual([hairSpace, hairSpace, 'M'])
    shifted.forEach((call, i) => expect.soft(call.x).toBeCloseTo(expectedX[i] + 11, 5))
  })

  it('keeps adjacent ASCII separators and stops right-trimming at a hair space', async () => {
    const calls = await render(
      text(`<tspan>M${hairSpace}</tspan><tspan> M</tspan>`, 40) +
        text(`<tspan>M </tspan><tspan x="140">${hairSpace}</tspan>`, 80)
    )
    expect.soft(row(calls, 40).map(call => call.text)).toEqual(['M' + hairSpace, ' M'])
    expect.soft(row(calls, 40)[1]?.x).toBeCloseTo(20 + (await preservedAdvance('M' + hairSpace)), 5)
    expect.soft(row(calls, 80).map(call => call.text)).toEqual(['M ', hairSpace])
  })

  it('counts hair spaces as characters when adjusting textLength', async () => {
    for (const [contents, expected, count] of [
      [hairSpace + 'MM', [hairSpace + 'MM'], 3],
      [hairSpace + '<tspan>A</tspan> B', [hairSpace, 'A', ' B'], 4],
      ['IMM', ['IMM'], 3],
      ['I<tspan>A</tspan> B', ['I', 'A', ' B'], 4]
    ] as const) {
      const shorter = await render(text(contents, 40, 'textLength="64"'))
      const longer = await render(text(contents, 40, 'textLength="100"'))
      expect.soft(shorter.map(call => call.text)).toEqual(expected)
      expect.soft(longer.map(call => call.text)).toEqual(expected)
      for (const call of [...shorter, ...longer]) {
        expect.soft(Number.isFinite(call.charSpace), 'finite character spacing').toBe(true)
      }
      const spacingChange = (100 - 64) / (count - 1)
      let previousCharacters = 0
      expected.forEach((value, i) => {
        const shorterCall = shorter[i]
        const longerCall = longer[i]
        expect.soft(shorterCall, 'shorter text segment').toBeDefined()
        expect.soft(longerCall, 'longer text segment').toBeDefined()
        if (!shorterCall || !longerCall) return
        expect.soft(longerCall.charSpace - shorterCall.charSpace).toBeCloseTo(spacingChange, 5)
        expect.soft(longerCall.x - shorterCall.x).toBeCloseTo(previousCharacters * spacingChange, 5)
        previousCharacters += value.length
      })
    }
  })

  it('preserves ASCII normalization and the existing preserve modes', async () => {
    const preserved = ' ' + hairSpace + 'M' + hairSpace + ' '
    const calls = await render(
      text('  A\t\tB\nC   ', 40) +
        text('<tspan>A\t</tspan><tspan> B</tspan>', 80) +
        text('<tspan>A \n</tspan><tspan> B</tspan>', 120) +
        text('<tspan>A &#xD;</tspan><tspan> B</tspan>', 160) +
        text(preserved, 200, 'xml:space="preserve"') +
        text(`<tspan>${preserved}</tspan>`, 240, 'style="white-space: pre"')
    )
    expect.soft(row(calls, 40).map(call => call.text)).toEqual(['A BC'])
    const asciiAdvance = await preservedAdvance('A ')
    for (const y of [80, 120, 160]) {
      expect.soft(row(calls, y).map(call => call.text)).toEqual(['A ', 'B'])
      expect.soft(row(calls, y)[1]?.x).toBeCloseTo(20 + asciiAdvance, 5)
    }
    expect.soft(row(calls, 200).map(call => call.text)).toEqual([preserved])
    expect.soft(row(calls, 240).map(call => call.text)).toEqual([preserved])
  })
})
