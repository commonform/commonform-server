module.exports = requireAuthorization

var unauthorized = require('./responses/unauthorized')
var thrice = require('../thrice')
var bcrypt = require('bcrypt-password')
var publisherKey = require('../keys/publisher')
var internalError = require('./responses/internal-error')

function requireAuthorization(handler) {
  return function(request, response, parameters, log, level) {
    var handlerArguments = arguments
    var publisher = parameters.publisher
    var authorization = request.headers.authorization
    if (authorization) {
      var parsed = parseAuthorization(authorization)
      var mustLogIn = ( parsed === false || parsed.user !== publisher)
      if (mustLogIn) { unauthorized(response) }
      else {
        checkPassword(level, publisher, parsed.password, function(error, valid) {
          /* istanbul ignore if */
          if (error) { internalError(response, error) }
          else {
            if (valid) { handler.apply(this, handlerArguments) }
            else { unauthorized(response) } } }) } }
    else { unauthorized(response) } } }

function checkPassword(level, publisher, password, callback) {
  var key = publisherKey(publisher)
  var get = level.get.bind(level, key)
  thrice(get, function(error, value) {
    if (error) {
      /* istanbul ignore else */
      if (error.notFound) { callback(null, false) }
      else { callback(error) } }
    else {
      var object = JSON.parse(value)
      bcrypt.check(password, object.password, callback) } }) }

// Parse "Authorization: Basic $base64" headers.
function parseAuthorization(header) {
  var token = header.split(/\s/).pop()
  var decoded = new Buffer(token, 'base64').toString()
  var components = decoded.split(':')
  if (components.length !== 2) { return false }
  else { return { user: components[0], password: components[1] } } }
