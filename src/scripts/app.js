const {render, unmountComponentAtNode} = require('react-dom')

let featureTeardown
let removeRenderWatcher

// Note: this code must run FIRST to ensure successful recovery from synchronous
// exceptions during HMR, including transpilation errors inserted by webpack.
// All imports below must use `require` rather than `import`.
if (module.hot) {
  module.hot.accept(err => {
    console.warn('Exception during HMR update.', err)
  })
  module.hot.dispose(() => {
    console.clear()
    if (typeof featureTeardown === 'function') featureTeardown()
    if (typeof removeRenderWatcher === 'function') removeRenderWatcher()
    unmountComponentAtNode(getRoot())
  })
}

/**
 * Setup
 */

require('./utils/polyfills')

const {env, featureSetup} = require('./core')

// true = use subdirectories
// http://fineonly.com/solutions/regex-exclude-a-string
const requireContext = require.context('./features', true, /^((?!\/index).)*\.js$/)

const features = requireContext.keys().map(requireContext)

/**
 * Rendering
 */

const {delayingWatcher, seq, merge} = require('prax')
const {reactiveCreateClass, cachingTransformType, createCreateElement,
       renderingWatcher} = require('prax/react')
const {routes} = require('./routes')

const createClass = reactiveCreateClass(React.createClass, env)

const transformType = cachingTransformType(createClass)

const createElement = createCreateElement(transformType)

React.createElement = function maybeCreateElement (type) {
  if (type == null && window.developmentMode) throw Error('Missing element type')
  return createElement(...arguments)
}

function renderRoot () {
  render(routes, getRoot(), () => {
    env.send({type: 'dom/post-render'})
  })
}

function getRoot () {
  return document.getElementById('root')
}

/**
 * Init
 */

env.enque(function init () {
  featureTeardown = featureSetup(env, features)

  env.notifyWatchers(env.state, env.state)

  removeRenderWatcher = env.addWatcher(delayingWatcher(seq(renderRoot, renderingWatcher)))

  renderRoot()
})

/**
 * Debug
 */

const prax = require('prax')
const fp = require('lodash-fp')

window.app = _.omit(
  {...prax,
    fp, prax, React: require('react'), ReactDOM: require('react-dom'),
    features: merge(...features),
    ...window.app,
  },
  // A global `exports` breaks Browsersync (!)
  ['isNaN', 'isFinite', 'exports']
)

if (window.developmentMode) {
  ['log', 'info', 'warn', 'error', 'clear'].forEach(key => {
    if (!/bound/.test(console[key].name)) {
      window[key] = console[key] = console[key].bind(console)
    }
  })
  _.assign(window, window.app)
}
