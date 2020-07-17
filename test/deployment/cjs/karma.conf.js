const commonConfig = require('../../common/karma.common.conf')
module.exports = config => {
  config.set({
    ...commonConfig,

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '../../..',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai'],

    webpack: {
      mode: 'development',
      resolve: {
        extensions: ['.js']
      }
    },

    // list of files / patterns to load in the browser
    files: [
      'test/common/compare.js',
      'test/common/tests.js',

      {
        pattern: 'test/deployment/cjs/cjs.spec.js',
        included: true,
        served: true,
        watched: true
      },

      ...commonConfig.files
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/deployment/cjs/cjs.spec.js': 'webpack'
    }
  })
}
