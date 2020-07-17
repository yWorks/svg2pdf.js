module.exports = config => {
  const commonConfig = require('../common/karma.common.conf')
  config.set({
    ...commonConfig,

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

      ...commonConfig.files
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
