var isNotFoundError = require('../is-not-found-error')
var keyFor = require('../keys/annotation')
var thrice = require('../thrice')

module.exports = function (level, uuid, callback) {
  var get = level.get.bind(level, keyFor(uuid))
  thrice(get, callback, isNotFoundError)
}
