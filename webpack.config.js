const path = require('path');

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './web/index.jsx',
  // entry: './src/plot-sample/index-recharts.jsx',
  output: {
    path: path.resolve(__dirname, 'dist-web'),
    publicPath: '',
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.jsx?/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['es2015', 'react'],
              plugins: ["transform-object-rest-spread"]
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          // 'style-loader',
          // 'css-loader'
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  plugins: [
    // new webpack.optimize.UglifyJsPlugin({
    //     compress: {
    //         warnings: false,
    //     },
    //     output: {
    //         comments: false,
    //     },
    // }),
    new HtmlWebpackPlugin({
      title: 'KMB ETA',
      template: './web/index.ejs'
    }),
    new webpack.DefinePlugin({
      'process.env': {
        // NODE_ENV: JSON.stringify('production')
      }
    }),
  ],
};
