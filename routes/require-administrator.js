var isAdministrator = require('./is-administrator')
var parseAuthorization = require('basic-auth')
var unauthorized = require('./responses/unauthorized')

module.exports = function (handler) {
  return function (request, response, parameters, log) {
    var parsed = parseAuthorization(request)
    if (parsed === undefined) {
      unauthorized(response)
    } else {
      if (isAdministrator(log, parsed)) {
        request.publisher = 'administrator'
        handler.apply(this, arguments)
      } else {
        unauthorized(response)
      }
    }
  }
}
