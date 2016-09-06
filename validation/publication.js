var isDigest = require('is-sha-256-hex-digest')
var schema = require('signature-page-schema')
var tv4 = require('tv4')
var validDirection = require('commonform-validate-direction')

module.exports = function (argument) {
  return (
    (
      argument.hasOwnProperty('digest') &&
      isDigest(argument.digest)
    ) &&
    (
      !argument.hasOwnProperty('signaturePages') ||
      (
        Array.isArray(argument.signaturePages) &&
        argument.signaturePages.every(function (page) {
          return tv4.validate(page, schema)
        })
      )
    ) &&
    (
      !argument.hasOwnProperty('directions') ||
      (
        Array.isArray(argument.directions) &&
        argument.directions.every(function (direction) {
          return (
            validDirection(direction) &&
            (
              direction.blank.length === 2 ||
              direction.blank.length % 3 === 2
            )
          )
        })
      )
    )
  )
}
