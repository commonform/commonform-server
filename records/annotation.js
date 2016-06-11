var VERSION = require('../package.json').version

module.exports = function(annotation) {
  return { version: VERSION, annotation: annotation } }
