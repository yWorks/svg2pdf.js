import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Simulate a consumer project: a temp dir whose node_modules contains this
// package (symlinked to the repo root, built files in dist/) and jspdf, then
// run plain `node` against it like the issue's repro does.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

function withConsumer(files, fn) {
  const dir = mkdtempSync(join(tmpdir(), 'svg2pdf-consumer-'))
  try {
    mkdirSync(join(dir, 'node_modules'))
    symlinkSync(root, join(dir, 'node_modules', 'svg2pdf.js'), 'dir')
    symlinkSync(join(root, 'node_modules', 'jspdf'), join(dir, 'node_modules', 'jspdf'), 'dir')
    for (const [name, source] of Object.entries(files)) writeFileSync(join(dir, name), source)
    return fn(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

const run = (dir, file) =>
  execFileSync(process.execPath, [file], { cwd: dir, encoding: 'utf8', stdio: 'pipe' }).trim()

test('ESM consumer: import registers jsPDF.API.svg (issue #394 repro)', () => {
  const out = withConsumer(
    {
      'repro.mjs': `
import { jsPDF } from 'jspdf'
import 'svg2pdf.js'
console.log(typeof jsPDF.API.svg)
`
    },
    dir => run(dir, 'repro.mjs')
  )
  assert.equal(out, 'function')
})

test('ESM consumer: named export svg2pdf is available', () => {
  const out = withConsumer(
    {
      'repro.mjs': `
import { svg2pdf } from 'svg2pdf.js'
console.log(typeof svg2pdf)
`
    },
    dir => run(dir, 'repro.mjs')
  )
  assert.equal(out, 'function')
})

test('CommonJS consumer: require() loads the package', () => {
  const out = withConsumer(
    {
      'repro.cjs': `
const { jsPDF } = require('jspdf')
const { svg2pdf } = require('svg2pdf.js')
console.log(typeof svg2pdf, typeof jsPDF.API.svg)
`
    },
    dir => run(dir, 'repro.cjs')
  )
  assert.equal(out, 'function function')
})

for (const [module, moduleResolution] of [
  ['Node16', 'Node16'],
  ['NodeNext', 'NodeNext'],
  ['ESNext', 'Bundler']
]) {
  test(`TypeScript consumer: tsc --noEmit (${moduleResolution})`, () => {
    withConsumer(
      {
        'package.json': JSON.stringify({ type: 'module' }),
        'consumer.ts': `
import { jsPDF } from 'jspdf'
import { svg2pdf, type Svg2pdfOptions } from 'svg2pdf.js'
import 'svg2pdf.js'

const pdf = new jsPDF()
const element = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
const options: Svg2pdfOptions = { width: 100, loadImages: false }
const rendered: Promise<jsPDF> = svg2pdf(element, pdf, options)
const augmented: Promise<jsPDF> = pdf.svg(element, options)
// @ts-expect-error width must be numeric (also guards against untyped exports)
svg2pdf(element, pdf, { width: '100' })
`,
        'tsconfig.json': JSON.stringify({
          compilerOptions: {
            strict: true,
            noEmit: true,
            module,
            moduleResolution,
            target: 'ES2020',
            types: []
          },
          files: ['consumer.ts']
        })
      },
      dir =>
        execFileSync(
          process.execPath,
          [join(root, 'node_modules/typescript/bin/tsc'), '--noEmit'],
          {
            cwd: dir,
            encoding: 'utf8',
            stdio: 'pipe'
          }
        )
    )
  })
}
