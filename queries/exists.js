var isNotFoundError = require('../is-not-found-error')
var thrice = require('../thrice')

module.exports = function(level, key, callback) {
  var get = level.get.bind(level, key)
  thrice(get, onResult, isNotFoundError)
  function onResult(error) {
    if (error) {
      /* istanbul ignore else */
      if (error.notFound) { callback(null, false) }
      else { callback(error) } }
    else { callback(null, true) } } }
