module.exports = formToProjectKey

var encode = require('bytewise/encoding/hex').encode

var PREFIX = 'form-to-project'

function formToProjectKey(digest, publisher, project, edition, root) {
  return encode([ PREFIX, digest, publisher, project, edition, root ]) }
