const {pipe, hackClassBy} = require('prax')
const {cachingTypeTransform, coerceToComponentClass,
  atomComponentProps, safeRenderingComponentProps} = require('prax/react')
const {env} = require('./env')

const transformType = cachingTypeTransform(pipe(
  coerceToComponentClass,

  hackClassBy(atomComponentProps(env.store, {env})),

  hackClassBy(safeRenderingComponentProps),
))

module.exports = function createElement () {
  'use strict'
  arguments[0] = transformType(arguments[0])
  return React.createElement(...arguments)
}
