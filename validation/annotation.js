var has = require('has')
var isDigest = require('is-sha-256-hex-digest')
var isUUID = require('./uuid')

module.exports = function (argument) {
  var has = hasProperty.bind(null, argument)
  return (
    typeof argument === 'object' &&
    has('form', isDigest) &&
    has('context', isDigest) &&
    has('publisher', nonemptyString) &&
    has('text', nonemptyString) &&
    has('replyTo', function (value) {
      return Array.isArray(value) && value.every(isUUID)
    }) &&
    Object.keys(argument).length === 5
  )
}

function hasProperty (object, key, predicate) {
  return (
    has(object, key) &&
    predicate(object[key])
  )
}

function nonemptyString (argument) {
  return (
    typeof argument === 'string' &&
    argument.length !== 0
  )
}
