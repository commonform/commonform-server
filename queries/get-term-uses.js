module.exports = getTermUses

var decode = require('bytewise/encoding/hex').decode
var encode = require('bytewise/encoding/hex').encode

var PREFIX = 'term-used-in-form'

function getTermUses(level, term, callback) {
  var digests = [ ]
  level.createReadStream(
    { gt: encode([ PREFIX, term, null ]),
      lt: encode([ PREFIX, term, undefined ]) })
    .on('data', function(item) { digests.push(decode(item.key)[2]) })
    .on('error', function(error) { callback(error) })
    .on('end', function() { callback(null, digests) }) }
