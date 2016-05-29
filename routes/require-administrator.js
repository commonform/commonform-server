var unauthorized = require('./responses/unauthorized')
var parseAuthorization = require('./parse-authorization')
var isAdministrator = require('./is-administrator')

module.exports = function(handler) {
  return function(request, response, parameters, log) {
    var handlerArguments = arguments
    var authorization = request.headers.authorization
    if (authorization) {
      var parsed = parseAuthorization(authorization)
      var mustLogIn = ( parsed === false )
      if (mustLogIn) { unauthorized(response) }
      else {
        if (isAdministrator(log, parsed)) {
          request.publisher = 'administrator'
          handler.apply(this, handlerArguments) }
        else { unauthorized(response) } } }
    else { unauthorized(response) } } }
