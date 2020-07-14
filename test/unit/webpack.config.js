const path = require('path')

module.exports = {
  entry: './src/svg2pdf.ts',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  devtool: 'inline-source-map',
  output: {
    filename: 'svg2pdf.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd'
  }
}
