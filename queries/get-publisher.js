var keyFor = require('../keys/publisher')
var thrice = require('../thrice')

module.exports = function(level, publisher, callback) {
  var get = level.get.bind(level, keyFor(publisher))
  thrice(get, function(error, record) {
    if (error) {
      /* istanbul ignore else */
      if (error.notFound) { callback(null, false) }
      else { callback(error) } }
    else { callback(null, JSON.parse(record).publisher) } }) }