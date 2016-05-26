var encode = require('bytewise/encoding/hex').encode

module.exports = function(publisher) {
  var eventBus = this
  var key = encode([ 'publisher', publisher ])
  eventBus.level.put(key, undefined, function(error) {
    if (error) { eventBus.log.error(error) } }) }