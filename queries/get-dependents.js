var decode = require('../keys/decode')
var encode = require('../keys/encode')
var once = require('once')

var PREFIX = 'component-in-form'

module.exports = function (level, publisher, project, callback) {
  callback = once(callback)
  var parents = []
  level.createReadStream({
    gt: encode([PREFIX, publisher, project, '']),
    lt: encode([PREFIX, publisher, project, '~'])
  })
    .on('data', function (item) {
      var decoded = decode(item.key)
      parents.push({
        parent: decoded[3],
        depth: parseInt(decoded[4])
      })
    })
    .once('error', /* istanbul ignore next */ function (error) {
      callback(error)
    })
    .once('end', function () {
      callback(null, parents)
    })
}
