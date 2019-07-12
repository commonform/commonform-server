var has = require('has')
var isDigest = require('is-sha-256-hex-digest')

module.exports = function (argument) {
  return (
    (
      has(argument, 'digest') &&
      isDigest(argument.digest)
    )
  )
}
