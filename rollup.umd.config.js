import typescript from 'rollup-plugin-typescript'
import { terser } from 'rollup-plugin-terser'
import pkg from './package.json'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import replace from '@rollup/plugin-replace'
import replaceOutput from './rollup-plugin-replace-output'

const globals = {
  cssesc: 'cssesc',
  'jspdf-yworks': 'jsPDF',
  svgpath: 'svgpath'
}

export default {
  input: 'src/svg2pdf.ts',
  output: [
    {
      file: 'dist/svg2pdf.js',
      format: 'umd',
      name: 'svg2pdf',
      globals
    },
    {
      file: 'dist/svg2pdf.min.js',
      format: 'umd',
      name: 'svg2pdf',
      globals
    }
  ],
  external: [...Object.keys(pkg.peerDependencies || {})],
  plugins: [
    replace({
      'jspdf-yworks/dist/jspdf.node.debug': 'jspdf-yworks'
    }),
    typescript({
      typescript: require('typescript')
    }),
    terser({
      include: /\.min.js/
    }),
    resolve(),
    commonjs(),
    replaceOutput([
      {
        include: /\.min.js/,
        search: /["']jspdf-yworks["']/g,
        replace: '"jspdf-yworks/dist/jspdf.min"'
      },
      {
        include: /[^m][^i][^n].js/,
        search: /["']jspdf-yworks["']/g,
        replace: '"jspdf-yworks/dist/jspdf.debug"'
      }
    ])
  ]
}
