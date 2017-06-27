var decode = require('../keys/decode')
var encode = require('../keys/encode')

module.exports = function (prefix) {
  return function (level, name, skip, limit, callback) {
    var results = []
    level.createReadStream({
      gt: encode([prefix, name, '']),
      lt: encode([prefix, name, '~']),
      limit: limit
    })
      .on('data', function (item) {
        if (skip !== 0) {
          skip--
        } else {
          results.push(decode(item.key)[2])
        }
      })
      .once('error', /* istanbul ignore next */ function (error) {
        callback(error)
      })
      .once('end', function () {
        callback(null, results)
      })
  }
}
