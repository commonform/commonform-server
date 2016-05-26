var encode = require('./encode')

var PREFIX = 'form-to-project'

module.exports = function(digest, publisher, project, edition, root) {
  return encode([ PREFIX, digest, publisher, project, edition, root ]) }
