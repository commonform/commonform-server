module.exports = editionKey

var encode = require('bytewise/encoding/hex').encode

function editionKey(publisher, project, edition) {
  return encode([ 'projects', publisher, project, edition ]) }
