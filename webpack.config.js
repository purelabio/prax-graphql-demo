'use strict'

const pt = require('path')
const webpack = require('webpack')
const prod = process.env.NODE_ENV === 'production'
const realpathSync = require('fs').realpathSync

module.exports = {
  entry: {
    app: pt.resolve('src/scripts/app.js'),
    embed: pt.resolve('src/scripts/embed.js'),
  },

  output: {
    path: pt.resolve('dist'),
    filename: '[name].js'
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel',
        include: [
          realpathSync('src/scripts'),
          realpathSync('node_modules/purelib/src/js'),
        ]
      },
      {test: /\.json$/, loader: 'json'}
    ].concat(!prod ? [] : [
      // disable dev features and warnings in React and react-router
      {
        test: /react.*\.jsx?$/,
        include: /node_modules/,
        loader: 'transform?envify'
      }
    ])
  },

  resolve: {
    alias: {
      // Force-resolve react and react-dom to ensure we always get only one
      // version of each.
      react: realpathSync('node_modules/react'),
      'react-dom': realpathSync('node_modules/react-dom'),
      purelib: realpathSync('node_modules/purelib/src/js'),
    }
  },

  plugins: [
    new webpack.ProvidePlugin({
      React: 'react',
      _: 'lodash',
    }),
    new webpack.ContextReplacementPlugin(
      /moment\/locale/,
      // Ignore all locales; `en` is always included.
      /matches_nothing/
    ),
  ].concat(!prod ? [
    new webpack.HotModuleReplacementPlugin()
  ] : [
    new webpack.optimize.UglifyJsPlugin({
      minimize: true,
      compress: {warnings: false, screw_ie8: true},
      mangle: true
    })
  ]),

  devtool: prod ? 'source-map' : null,

  // For reference. Disable when reviewing bundle details.
  stats: {
    colors: true,
    chunks: false,
    version: false,
    hash: false,
    assets: false
  }
}
