var internalError = require('./responses/internal-error')
var isAdministrator = require('./is-administrator')
var parseAuthorization = require('./parse-authorization')
var unauthorized = require('./responses/unauthorized')
var checkPassword = require('./check-password')

module.exports = function(handler) {
  return function(request, response, parameters, log, level) {
    var handlerArguments = arguments
    request.publisher = false
    function done() { handler.apply(this, handlerArguments) }
    var authorization = request.headers.authorization
    if (authorization) {
      var parsed = parseAuthorization(authorization)
      if (parsed === false) { done() }
      else {
        if (isAdministrator(log, parsed)) {
          request.publisher = 'administrator'
          done() }
        else {
          checkPassword(
            level, parsed.user, parsed.password, response,
            function(error, valid) {
              /* istanbul ignore if */
              if (error) { internalError(response, error) }
              else {
                if (valid) {
                  request.publisher = parsed.user
                  done() }
                else { unauthorized(response) } } }) } } }
    else { done() } } }
