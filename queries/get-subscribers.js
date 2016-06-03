var keyFor = require('../keys/subscription')
var decode = require('../keys/decode')
var once = require('once')

module.exports = function(level, keys, callback) {
  callback = once(callback)
  var subscribers = [ ]
  level.createReadStream(
    { gt: keyFor(keys.concat(null)),
      lt: keyFor(keys.concat(undefined)),
      keys: true,
      values: false })
    .on('data', function(key) {
      var decoded = decode(key)
      subscribers.push(decoded[decoded.length - 1]) })
    .on('error',
      /* istanbul ignore next */
      function(error) { callback(error) })
    .on('end', function() {
      callback(null, subscribers.sort()) }) }
