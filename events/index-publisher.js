var encode = require('../keys/encode')

module.exports = function(publisher) {
  var eventBus = this
  var key = encode([ 'publisher', publisher ])
  eventBus.level.put(key, undefined, function(error) {
    /* istanbul ignore if */
    if (error) { eventBus.log.error(error) } }) }
