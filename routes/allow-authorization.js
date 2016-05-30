var internalError = require('./responses/internal-error')
var isAdministrator = require('./is-administrator')
var parseAuthorization = require('basic-auth')
var unauthorized = require('./responses/unauthorized')
var checkPassword = require('./check-password')

module.exports = function(handler) {
  return function(request, response, parameters, log, level) {
    var handlerArguments = arguments
    request.publisher = false
    function done() { handler.apply(this, handlerArguments) }
    var parsed = parseAuthorization(request)
    if (parsed === undefined) { done() }
    else {
      if (isAdministrator(log, parsed)) {
        request.publisher = 'administrator'
        done() }
      else {
        checkPassword(
          level, parsed.name, parsed.pass, response,
          function(error, valid) {
            /* istanbul ignore if */
            if (error) { internalError(response, error) }
            else {
              if (valid) {
                request.publisher = parsed.name
                done() }
              else { unauthorized(response) } } }) } } } }
