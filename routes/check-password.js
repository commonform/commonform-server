var bcrypt = require('bcrypt-password')
var isNotFoundError = require('../is-not-found-error')
var publisherKey = require('../keys/publisher')
var thrice = require('../thrice')

module.exports = function (level, publisher, password, response, callback) {
  var key = publisherKey(publisher)
  var get = level.get.bind(level, key)
  thrice(get, onResult, isNotFoundError)
  function onResult (error, value) {
    if (error) {
      /* istanbul ignore else */
      if (error.notFound) callback(null, false)
      else callback(error)
    } else {
      var object = JSON.parse(value).publisher
      bcrypt.check(password, object.hash, callback)
    }
  }
}
