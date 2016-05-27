var bcrypt = require('bcrypt-password')
var internalError = require('./responses/internal-error')
var isAdministrator = require('./is-administrator')
var isNotFoundError = require('../is-not-found-error')
var parseAuthorization = require('./parse-authorization')
var publisherKey = require('../keys/publisher')
var thrice = require('../thrice')
var unauthorized = require('./responses/unauthorized')

module.exports = function(handler) {
  return function(request, response, parameters, log, level) {
    var handlerArguments = arguments
    function allow() { handler.apply(this, handlerArguments) }
    var publisher = parameters.publisher
    var authorization = request.headers.authorization
    if (authorization) {
      var parsed = parseAuthorization(authorization)
      var mustLogIn = ( parsed === false )
      if (mustLogIn) { unauthorized(response) }
      else {
        if (isAdministrator(log, parsed)) { allow() }
        else {
          if (parsed.user !== publisher) { unauthorized(response) }
          else {
            checkPassword(
              level, publisher, parsed.password, response,
              function(error, valid) {
                /* istanbul ignore if */
                if (error) { internalError(response, error) }
                else {
                  if (valid) { allow() }
                  else { unauthorized(response) } } }) } } } }
    else { unauthorized(response) } } }

function checkPassword(level, publisher, password, response, callback) {
  var key = publisherKey(publisher)
  var get = level.get.bind(level, key)
  thrice(get, onResult, isNotFoundError)
  function onResult(error, value) {
    if (error) {
      /* istanbul ignore else */
      if (error.notFound) { callback(null, false) }
      else { callback(error) } }
    else {
      var object = JSON.parse(value)
      bcrypt.check(password, object.password, callback) } } }
