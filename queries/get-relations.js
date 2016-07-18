var decode = require('../keys/decode')
var encode = require('../keys/encode')

module.exports = function (prefix) {
  return function (level, name, callback) {
    var results = []
    level.createReadStream({
      gt: encode([prefix, name, '']),
      lt: encode([prefix, name, '~'])
    })
    .on('data', function (item) {
      results.push(decode(item.key)[2])
    })
    .once('error', /* istanbul ignore next */ function (error) {
      callback(error)
    })
    .once('end', function () {
      callback(null, results)
    })
  }
}
