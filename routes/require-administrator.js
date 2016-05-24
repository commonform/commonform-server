module.exports = requireAdministrator

var unauthorized = require('./responses/unauthorized')
var parseAuthorization = require('./parse-authorization')
var isAdministrator = require('./is-administrator')

function requireAdministrator(handler) {
  return function(request, response, parameters, log, level) {
    var handlerArguments = arguments
    var authorization = request.headers.authorization
    if (authorization) {
      var parsed = parseAuthorization(authorization)
      var mustLogIn = ( parsed === false )
      if (mustLogIn) { unauthorized(response) }
      else {
        if (isAdministrator(log, parsed)) {
          handler.apply(this, handlerArguments) }
        else { unauthorized(response) } } }
    else { unauthorized(response) } } }
