var decode = require('../keys/decode')
var keyFor = require('../keys/subscription')
var once = require('once')

module.exports = function (level, keys, callback) {
  callback = once(callback)
  var subscribers = []
  level.createReadStream({
    gt: keyFor(keys.concat('subscriber', '')),
    lt: keyFor(keys.concat('subscriber', '~')),
    keys: true,
    values: false
  })
    .on('data', function (key) {
      var decoded = decode(key)
      var publisher = decoded[decoded.length - 1]
      subscribers.push(publisher)
    })
    .once('error', /* istanbul ignore next */ function (error) {
      callback(error)
    })
    .once('end', function () {
      callback(null, subscribers.sort())
    })
}
