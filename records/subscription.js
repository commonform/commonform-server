var VERSION = require('../package.json').version

module.exports = function(components, event) {
  return (
    { version: VERSION,
      subscription: { components: components, event: event } } ) }
