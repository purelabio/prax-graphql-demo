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

const lifecycler = app.lifecycler || (app.lifecycler = Lifecycler())

const {root, reinit} = require('./root')

lifecycler.reinit(root, bind(reinit, require('./features').index))

/**
 * REPL
 */

const prax = require('prax')
const praxReact = require('prax/react')

window.app = _.omit(
  {
    React: require('react'),
    ReactDOM: require('react-dom'),
    ...window.app,
    ...prax,
    prax,
    praxReact,
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
