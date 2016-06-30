var encode = require('./encode')

module.exports = function (name) {
  return encode(['publishers', name])
}
