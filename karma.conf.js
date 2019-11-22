// Karma configuration
'use strict'
module.exports = (config) => {
  const testCoverage = process.argv.indexOf('--coverage') >= 0
  const preprocessors = {
    'tests/tests.js': 'babel'
  };

  // currently it is not possible to have both coverage and browserify, so a coverage run needs to have the files
  // pre-bundled in dist/ (as the npm script does)
  if (testCoverage) {
    preprocessors['dist/svg2pdf.js'] = 'coverage'
  } else {
    preprocessors['tests/runTests.js'] = 'webpack'
  }

  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai']/* .concat(testCoverage ? [] : ['']) */,

    webpack: require('./webpack.config.js'),

    // list of files / patterns to load in the browser
    files: [
      'node_modules/jspdf-yworks/dist/jspdf.min.js',

      'tests/utils/compare.js',

      {
        pattern: 'tests/runTests.js',
        included: true,
        served: true,
        watched: true,
        type: "module"
      },

      {
        pattern: 'tests/**/spec.svg',
        included: false,
        served: true
      }, {
        pattern: 'tests/**/reference.pdf',
        included: false,
        watched: false,
        served: true
      }, {
        pattern: 'tests/**/*.css',
        included: false,
        served: true
      }
    ],

    // list of files to exclude
    exclude: [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: preprocessors,

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha'].concat(testCoverage ? ['coverage'] : []),

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: testCoverage,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    coverageReporter: {
      reporters: [
        {
          type: 'lcov',
          dir: 'coverage/'
        },
        {
          type: 'text'
        }
      ]
    }
  })
}
