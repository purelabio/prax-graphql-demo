const {render, unmountComponentAtNode} = require('react-dom')
const {bind} = require('prax')
const {routes} = require('../routes')

export function init (env, onDeinit) {
  const rootNode = document.getElementById('root')

  render(routes, rootNode)

  onDeinit(bind(unmountComponentAtNode, rootNode))
}
