var isDigest = require('is-sha-256-hex-digest')
var schema = require('signature-page-schema')
var tv4 = require('tv4')

module.exports = function (argument) {
  return (
    (
      argument.hasOwnProperty('digest') &&
      isDigest(argument.digest)
    ) &&
    (
      !argument.hasOwnProperty('signaturePages') ||
      argument.signaturePages.every(function (page) {
        return tv4.validate(page, schema)
      })
    )
  )
}
