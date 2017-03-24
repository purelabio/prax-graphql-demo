'use strict'

const pt = require('path')
const fs = require('fs')
const webpack = require('webpack')
const prod = process.env.NODE_ENV === 'production'

module.exports = {
  entry: {
    main: pt.resolve('src/scripts/main.js'),
  },

  output: {
    path: pt.resolve('gh-pages/scripts'),
    filename: '[name].js',
    // For dev middleware
    publicPath: '/scripts/',
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        include: [
          fs.realpathSync('src/scripts'),
          fs.realpathSync('node_modules/purelib/src/js'),
        ],
        use: {
          loader: 'babel-loader',
        }
      },
      ...(!prod ? [] : [
        // disable dev features and warnings in React and related libs
        {
          test: /react.*\.jsx?$/,
          include: /node_modules/,
          use: {loader: 'transform-loader', options: {envify: true}},
        }
      ])
    ],
  },

  resolve: {
    alias: {
      purelib: fs.realpathSync('node_modules/purelib/src/js'),
    },
  },

  plugins: [
    new webpack.ProvidePlugin({
      _: 'lodash',
      React: 'react',
    }),
    ...(prod ? [
      new webpack.optimize.UglifyJsPlugin({
        minimize: true,
        compress: {warnings: false, screw_ie8: true},
        mangle: true,
        sourceMap: true,
      }),
    ] : [
      new webpack.HotModuleReplacementPlugin(),
    ]),
  ],

  devtool: prod ? 'source-map' : false,

  // For dev middleware
  stats: {
    colors: true,
    chunks: false,
    version: false,
    hash: false,
    assets: false
  }
}
