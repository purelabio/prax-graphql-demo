// true = use subdirectories
// http://fineonly.com/solutions/regex-exclude-a-string
const requireContext = require.context('./', true, /^((?!\/index).)*\.js$/)

_.assign(exports,
  require('purelib/utils'),
  ...requireContext.keys().map(requireContext),
)

window.app = {...window.app, utils: exports}
