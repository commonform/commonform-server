var decode = require('../keys/decode')
var encode = require('../keys/encode')

module.exports = function(prefix) {
  return function(level, name, callback) {
    var results = [ ]
    level.createReadStream(
      { gt: encode([ prefix, name, '' ]),
        lt: encode([ prefix, name, '~' ]) })
      .on('data', function(item) {
        results.push(decode(item.key)[2]) })
      .on('error',
        /* istanbul ignore next */
        function(error) { callback(error) })
      .on('end', function() { callback(null, results) }) } }
