var encode = require('./encode')

module.exports = function(digest) {
  return encode([ 'forms', digest ]) }
