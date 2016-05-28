var encode = require('./encode')

module.exports = function(uuid) {
  return encode([ 'annotations', uuid ]) }
