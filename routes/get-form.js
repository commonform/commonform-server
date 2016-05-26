var thrice = require('../thrice')
var formKeyFor = require('../keys/form')

module.exports = function(level, digest, callback) {
  var key = formKeyFor(digest)
  var get = level.get.bind(level, key)
  thrice(get, callback, isNotFoundError) }

// LevelUp `get` calls yield an error with `.notFound` set when a key
// doesn't exist in the store. This isn't an error per se, since the
// call succeeded. This predicate is used with calls to `thrice`.
function isNotFoundError(error) {
  return ( error && error.notFound ) }
