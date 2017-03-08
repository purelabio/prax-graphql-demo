'use strict'

const bs = require('browser-sync').create()
const {log} = require('gulp-util')
const mapValues = require('lodash/mapValues')

const prod = process.env.NODE_ENV === 'production'

const config = require('./webpack.config')

if (prod) {
  require('webpack')(config).watch({}, (err, stats) => {
    log('[webpack]', stats.toString(config.stats))
    if (err) log('[webpack]', err.message)
  })
}

const compiler = prod ? null : require('webpack')(extend(config, {
  entry: mapValues(config.entry, x => ['webpack-hot-middleware/client', x])
}))

bs.init({
  startPath: '/',
  server: {
    baseDir: 'dist',
    middleware: [
      ...(prod ? [] : [
        require('webpack-dev-middleware')(compiler, {
          publicPath: '/',
          stats: config.stats
        }),
        require('webpack-hot-middleware')(compiler),
      ]),
      require('connect-history-api-fallback')(),
    ]
  },
  port: 43524,
  files: 'dist',
  open: false,
  online: false,
  ui: false,
  ghostMode: false,
  notify: false
})

function extend (...args) {
  return args.reduce(assignOne, {})
}

function assignOne (left, right) {
  return Object.assign(left, right)
}
