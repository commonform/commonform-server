var VERSION = require('../package.json').version
var keyFor = require('../keys/annotation')
var thrice = require('../thrice')

// TODO Check for UUID collisions
// TODO Do not overwrite existing annotations
module.exports = function (level, annotation, callback) {
  var value = JSON.stringify({version: VERSION, annotation: annotation})
  var put = level.put.bind(level, keyFor(annotation.uuid), value)
  thrice(put, callback)
}
