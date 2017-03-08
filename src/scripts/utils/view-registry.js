const {duplicates, merge} = require('./utils')

export function extractViews (viewExports) {
  // Export keys are not minified.
  const candidates = _.map(viewExports, exports => (
    _.pickBy(exports, isCapitalisedFunction)
  ))

  const duplicateKeys = duplicates(_.flatMap(candidates, _.keys))
  if (duplicateKeys.length) {
    throw Error(`Duplicate view keys: ${duplicateKeys}`)
  }
  return merge(...candidates)
}

function isCapitalisedFunction (value, key) {
  return _.isFunction(value) && /^[A-Z]/.test(key)
}
