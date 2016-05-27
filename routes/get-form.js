var formKeyFor = require('../keys/form')
var isNotFoundError = require('../is-not-found-error')
var thrice = require('../thrice')

module.exports = function(level, digest, callback) {
  var key = formKeyFor(digest)
  var get = level.get.bind(level, key)
  thrice(get, callback, isNotFoundError) }
