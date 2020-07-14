module.exports = config => {
  config.set({
    ...require('../common/karma.common.conf'),

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '../..',

    webpack: require('./webpack.config.js'),

    // list of files / patterns to load in the browser
    files: [
      'test/common/compare.js',
      'test/common/tests.js',

      {
        pattern: 'test/unit/all.spec.js',
        included: true,
        served: true,
        watched: true,
        type: 'module'
      },

      {
        pattern: 'test/specs/**/spec.svg',
        included: false,
        served: true
      },
      {
        pattern: 'test/**/*.+(svg|png|jpg|jpeg|ttf)',
        included: false,
        served: true,
        watched: false
      },
      {
        pattern: 'test/specs/**/reference.pdf',
        included: false,
        watched: false,
        served: true
      }
    ],

    // list of files to exclude
    exclude: [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/unit/all.spec.js': 'webpack'
    }
  })
}
