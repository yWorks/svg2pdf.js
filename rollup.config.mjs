import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import license from 'rollup-plugin-license'
import * as fs from 'node:fs'
import * as path from 'node:path'

const pkg = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'package.json'), 'utf8'))

function licenseBanner() {
  return license({
    banner: {
      content: { file: './LICENSE' }
    }
  })
}

// types.d.ts is an ES module declaration because the package is "type": "module".
// CommonJS consumers need the same declarations in a .d.cts file.
function cjsTypes() {
  return {
    name: 'cjs-types',
    writeBundle() {
      fs.copyFileSync('types.d.ts', 'dist/types.d.cts')
    }
  }
}

const umdExternals = [
  ...Object.keys(pkg.peerDependencies || {}),
  ...Object.keys(pkg.optionalDependencies || {})
]
const externals = [...Object.keys(pkg.dependencies || {}), ...umdExternals]

const globals = {
  cssesc: 'cssesc',
  jspdf: 'jspdf',
  svgpath: 'svgpath'
}

const umd = {
  input: 'src/svg2pdf.ts',
  output: [
    {
      file: pkg.browser.replace('.es.min.', '.umd.'),
      format: 'umd',
      name: 'svg2pdf',
      exports: 'named',
      sourcemap: true,
      globals
    },
    {
      file: pkg.browser.replace('.es.', '.umd.'),
      format: 'umd',
      name: 'svg2pdf',
      exports: 'named',
      sourcemap: true,
      globals,
      plugins: [terser({})]
    },
    {
      // CommonJS copy of the minified UMD build for `require` (the package is "type": "module")
      file: pkg.main,
      format: 'umd',
      name: 'svg2pdf',
      exports: 'named',
      sourcemap: true,
      globals,
      plugins: [terser({})]
    }
  ],
  external: umdExternals,
  plugins: [
    typescript(),
    commonjs({ extensions: ['.js', '.ts'] }),
    resolve(),
    licenseBanner(),
    cjsTypes()
  ]
}

const es = {
  input: 'src/svg2pdf.ts',
  output: [
    {
      file: pkg.module.replace('.min', ''),
      format: 'es',
      name: 'svg2pdf',
      sourcemap: true,
      plugins: []
    },
    {
      file: pkg.module,
      format: 'es',
      name: 'svg2pdf',
      sourcemap: true,
      plugins: [terser({})]
    }
  ],
  external: externals,
  plugins: [typescript(), commonjs({ extensions: ['.js', '.ts'] }), resolve(), licenseBanner()]
}

export default [umd, es]
