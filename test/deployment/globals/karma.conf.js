const commonConfig = require('../../common/karma.common.conf')
module.exports = config => {
  config.set({
    ...commonConfig,

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '../../..',

    // list of files / patterns to load in the browser
    files: [
      'node_modules/jspdf/dist/jspdf.umd.js',
      'dist/svg2pdf.umd.js',
      'test/common/compare.js',
      'test/common/tests.js',

      'test/deployment/globals/globals.spec.js',

      ...commonConfig.files
    ]
  })
}
