var encode = require('../keys/encode')

var PREFIX = 'form-has-annotation'

module.exports = function(annotation) {
  var eventBus = this
  var key = encode([ PREFIX, annotation.form, annotation.uuid ])
  eventBus.level.put(key, JSON.stringify(annotation), function(error) {
    if (error) { eventBus.log.error(error) } }) }
