var internalError = require('./responses/internal-error')
var isAdministrator = require('./is-administrator')
var checkPassword = require('./check-password')
var parseAuthorization = require('./parse-authorization')
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
        if (isAdministrator(log, parsed)) {
          request.publisher = 'administrator'
          allow() }
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
