var isDigest = require('is-sha-256-hex-digest')
var isUUID = require('./uuid')

module.exports = function(argument) {
  var has = hasProperty.bind(null, argument)
  return (
    ( typeof argument === 'object' ) &&
    has('form', isDigest) &&
    has('context', isDigest) &&
    has('publisher', nonemptyString) &&
    has('text', nonemptyString) &&
    has('replyTo', function(value) {
      return ( ( value === null ) || isUUID(value) ) }) &&
    ( Object.keys(argument).length === 5 ) ) }

function hasProperty(object, key, predicate) {
  return ( object.hasOwnProperty(key) && predicate(object[key]) ) }

function nonemptyString(argument) {
  return ( ( typeof argument === 'string' ) && ( argument.length !== 0 ) ) }

function isBoolean(argument) {
  return ( ( argument === true ) || ( argument === false ) ) }
