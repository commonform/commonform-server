module.exports = editionKey

var encode = require('./encode')

function editionKey(publisher, project, edition) {
  return encode([ 'projects', publisher, project, edition ]) }
