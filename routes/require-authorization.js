var checkPassword = require('./check-password')
var forbidden = require('./responses/forbidden')
var internalError = require('./responses/internal-error')
var isAdministrator = require('./is-administrator')
var parseAuthorization = require('basic-auth')
var unauthorized = require('./responses/unauthorized')

module.exports = function (handler) {
  return function (request, response, parameters, log, level) {
    var handlerArguments = arguments
    function allow () { handler.apply(this, handlerArguments) }
    var publisher = parameters.hasOwnProperty('subscriber')
      ? parameters.subscriber
      : parameters.publisher
    var parsed = parseAuthorization(request)
    if (parsed === undefined) unauthorized(response)
    else {
      if (isAdministrator(log, parsed)) {
        request.publisher = 'administrator'
        allow()
      } else {
        if (parsed.name !== publisher) forbidden(response)
        else {
          checkPassword(
            level, publisher, parsed.pass, response,
            function (error, valid) {
              /* istanbul ignore if */
              if (error) internalError(response, error)
              else {
                if (valid) allow()
                else unauthorized(response)
              }
            }
          )
        }
      }
    }
  }
}
