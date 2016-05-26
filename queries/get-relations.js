var encode = require('bytewise/encoding/hex').encode
var decode = require('bytewise/encoding/hex').decode

module.exports = function(prefix) {
  return function(level, name, callback) {
    var results = [ ]
    level.createReadStream(
      { gt: encode([ prefix, name, null ]),
        lt: encode([ prefix, name, undefined ]) })
      .on('data', function(item) {
        results.push(decode(item.key)[2]) })
      .on('error', function(error) { callback(error) })
      .on('end', function() { callback(null, results) }) } }
