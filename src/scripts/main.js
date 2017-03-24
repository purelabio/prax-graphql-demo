// This must be executed before any other code.
if (module.hot) {
  module.hot.accept(err => {
    console.warn('Exception during HMR update.', err)
  })
  module.hot.dispose(() => {
    console.clear()
  })
}

/**
 * Init
 */

require('purelib/polyfills')

const {Lifecycler, bind} = require('prax')

const app = window.app || (window.app = {})

const lifecycler = app.lifecycler || (app.lifecycler = new Lifecycler())

const {env, reinit} = require('./env')

lifecycler.reinit(env, bind(reinit, lifecycler, require('./features').index))

/**
 * REPL
 */

const prax = require('prax')

window.app = _.omit(
  {
    React: require('react'),
    ...window.app,
    ...prax,
    prax,
    lifecycler,
  },
  // A global `exports` breaks Browsersync (!)
  ['isNaN', 'isFinite', 'exports']
)

if (window.devMode) {
  Object.assign(window, window.app)
  ;['log', 'info', 'warn', 'error', 'clear'].forEach(key => {
    if (!/bound/.test(console[key].name)) {
      window[key] = console[key] = console[key].bind(console)
    }
  })
}
