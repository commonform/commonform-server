var encode = require('./encode')

module.exports = function(components) {
  return encode([ 'subscription' ].concat(components)) }
