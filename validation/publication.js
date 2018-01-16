var isDigest = require('is-sha-256-hex-digest')

// TODO: Limit publication name length.

module.exports = function (argument) {
  return (
    (
      argument.hasOwnProperty('digest') &&
      isDigest(argument.digest)
    )
  )
}
