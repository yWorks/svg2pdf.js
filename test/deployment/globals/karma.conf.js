module.exports = config => {
  config.set({
    ...require('../../common/karma.common.conf'),

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '../../..',

    // list of files / patterns to load in the browser
    files: [
      'node_modules/jspdf/dist/jspdf.umd.js',
      'dist/svg2pdf.umd.js',
      'test/common/compare.js',
      'test/common/tests.js',

      'test/deployment/globals/globals.spec.js',

      {
        pattern: 'test/specs/**/spec.svg',
        included: false,
        served: true
      },
      {
        pattern: 'test/**/*+(svg|png|jpg|jpeg|ttf)',
        included: false,
        served: true
      },
      {
        pattern: 'test/specs/**/reference.pdf',
        included: false,
        watched: false,
        served: true
      }
    ]
  })
}
