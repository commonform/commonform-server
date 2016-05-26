var encode = require('bytewise/encoding/hex').encode

module.exports = function(publisher, project, edition, digest) {
  var log = this.log
  this.level.put(encode([ 'digest', digest ]), undefined, function(error) {
    if (error) { log.error(error) } }) }