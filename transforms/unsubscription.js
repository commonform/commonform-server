var subscriptionKeys = require('../subscription-keys')
var keyForSubscription = require('../keys/subscription')

module.exports = function (entry, done) {
  var data = entry.data
  var to = data.to
  var keyParts = []
  subscriptionKeys[to].forEach(function (key) {
    keyParts.push(key)
    keyParts.push(data[key])
  })
  var key = keyForSubscription(keyParts)
  done(null, [{type: 'del', key: key}])
}
