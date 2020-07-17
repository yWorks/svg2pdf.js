const browsersEnv = process.env.BROWSERS
const browsers = browsersEnv ? browsersEnv.split('.') : ['ChromeHeadless']

module.exports = {
  files: [
    {
      pattern: 'test/specs/**/spec.svg',
      included: false,
      served: true
    },
    {
      pattern: 'test/**/*+(svg|png|jpg|jpeg|ttf|css)',
      included: false,
      served: true
    },
    {
      pattern: 'test/specs/**/reference.pdf',
      included: false,
      watched: false,
      served: true
    }
  ],

  // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
  frameworks: ['mocha', 'chai'],

  // test results reporter to use
  // possible values: 'dots', 'progress'
  // available reporters: https://npmjs.org/browse/keyword/karma-reporter
  reporters: ['mocha'],

  mochaReporter: {
    showDiff: process.env.SHOW_DIFF === 'true'
  },

  mocha: {
    timeout: 10000
  },

  // web server port
  port: 9876,

  // enable / disable colors in the output (reporters and logs)
  colors: true,

  // enable / disable watching file and executing tests whenever any file changes
  autoWatch: true,

  // start these browsers
  // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
  browsers,

  // Continuous Integration mode
  // if true, Karma captures browsers, runs the tests and exits
  singleRun: true,

  // Concurrency level
  // how many browser should be started simultaneous
  concurrency: Infinity
}
