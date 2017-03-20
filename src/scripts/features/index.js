// true = use subdirectories
// http://fineonly.com/solutions/regex-exclude-a-string
const requireContext = require.context('./', true, /^((?!\/index).)*\.js$/)

const index = requireContext.keys().map(requireContext)

_.assign(exports, ...index)

exports.index = index

window.app = {...window.app, features: exports}
