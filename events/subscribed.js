var encode = require('../keys/encode')
var thrice = require('../thrice')

module.exports = function(/* variadic */) {
  var level = this.level
  var log = this.log
  var args = Array.prototype.slice.call(arguments)
  var subscriber = args[args.length - 1]
  var keyComponents = [ 'subscribed', subscriber ]
    .concat(args.slice(0, -1))
  var key = encode(keyComponents)
  var put = level.put.bind(level, key, true)
  thrice(put, function(error) {
    /* istanbul ignore next */
    if (error) { log.error(error) } }) }
