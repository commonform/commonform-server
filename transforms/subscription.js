var subscriptionKeys = require('../subscription-keys')
var keyForSubscription = require('../keys/subscription')

module.exports = function (entry, done) {
  var data = entry.data
  var to = data.to
  var key = keyForSubscription(
    subscriptionKeys[to].map(function (key) {
      return data[key]
    })
  )
  done(null, [{key: key}])
}
