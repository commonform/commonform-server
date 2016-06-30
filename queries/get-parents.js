var decode = require('../keys/decode')
var encode = require('../keys/encode')
var once = require('once')

var PREFIX = 'form-in-form'

module.exports = function (level, digest, callback) {
  callback = once(callback)
  var parents = []
  level.createReadStream({
    gt: encode([ PREFIX, digest, '' ]),
    lt: encode([ PREFIX, digest, '~' ])
  })
    .on('data', function (item) {
      var decoded = decode(item.key)
      parents.push({
        digest: decoded[2],
        depth: parseInt(decoded[3])
      })
    })
    .once('error',
      /* istanbul ignore next */
      function (error) { callback(error) })
    .once('end', function () { callback(null, parents) })
}
