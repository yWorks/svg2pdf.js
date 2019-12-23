import typescript from 'rollup-plugin-typescript'
import { terser } from 'rollup-plugin-terser'
import replace from '@rollup/plugin-replace'
import replaceOutput from './rollup-plugin-replace-output'

import pkg from './package.json'

export default {
  input: 'src/svg2pdf.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs'
    },
    {
      file: pkg.module,
      format: 'es'
    },
    {
      file: pkg.main.replace('.js', '.min.js'),
      format: 'cjs'
    },
    {
      file: pkg.module.replace('.js', '.min.js'),
      format: 'es'
    }
  ],
  external: [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})],
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
    replaceOutput([
      {
        include: /\.min.js/,
        search: /["']jspdf-yworks["']/g,
        replace: '"jspdf-yworks/dist/jspdf.node.min"'
      },
      {
        include: /[^m][^i][^n].js/,
        search: /["']jspdf-yworks["']/g,
        replace: '"jspdf-yworks/dist/jspdf.node.debug"'
      }
    ])
  ]
}
