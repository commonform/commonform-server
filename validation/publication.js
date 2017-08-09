var isDigest = require('is-sha-256-hex-digest')

module.exports = function (argument) {
  return (
    (
      argument.hasOwnProperty('digest') &&
      isDigest(argument.digest)
    )
  )
}
