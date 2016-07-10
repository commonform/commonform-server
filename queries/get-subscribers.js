var decode = require('../keys/decode')
var keyFor = require('../keys/subscription')
var once = require('once')

module.exports = function (level, keys, callback) {
  callback = once(callback)
  var subscribers = []
  level.createReadStream({
    gt: keyFor(keys.concat('')),
    lt: keyFor(keys.concat('~')),
    keys: true,
    values: false
  })
  .on('data', function (key) {
    var decoded = decode(key)
    var publisher = decoded[decoded.length - 3]
    var action = decoded[decoded.length - 1]
    if (action === 'subscribed') {
      if (subscribers.indexOf(publisher) === -1) {
        subscribers.push(publisher)
      }
    } else /* if (action === 'unsubscribed') */ {
      var index = subscribers.indexOf(publisher)
      if (index !== -1) subscribers.splice(index, 1)
    }
  })
  .once('error',
    /* istanbul ignore next */
    function (error) { callback(error) })
  .once('end', function () { callback(null, subscribers.sort()) })
}
