module.exports = config => {
  config.set({
    ...require('../../common/karma.common.conf'),

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '../../..',

    // we need webpack because of dependencies
    webpack: {
      mode: 'development',
      resolve: {
        extensions: ['.ts', '.js']
      },
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
          }
        ]
      }
    },

    // list of files / patterns to load in the browser
    files: [
      'test/common/compare.js',
      'test/common/tests.js',

      {
        pattern: 'test/deployment/typescript/typescript.spec.ts',
        included: true,
        served: true,
        watched: true
      },

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
    ],
    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/deployment/typescript/typescript.spec.ts': 'webpack'
    }
  })
}
