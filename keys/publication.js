var encode = require('./encode')

module.exports = function (publisher, project, edition) {
  return encode(['projects', publisher, project, edition])
}
