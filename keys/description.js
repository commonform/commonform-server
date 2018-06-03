var encode = require('./encode')

module.exports = function (publisher, project) {
  return encode(['descriptions', publisher, project])
}
