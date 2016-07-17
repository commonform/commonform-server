var encode = require('../keys/encode')

var PREFIX = 'form-has-annotation'

module.exports = function (entry, done) {
  var annotation = entry.data
  var key = encode([PREFIX, annotation.form, annotation.uuid])
  done(null, [{key: key, value: annotation}])
}
