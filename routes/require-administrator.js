var unauthorized = require('./responses/unauthorized')
var parseAuthorization = require('basic-auth')
var isAdministrator = require('./is-administrator')

module.exports = function(handler) {
  return function(request, response, parameters, log) {
    var parsed = parseAuthorization(request)
    if (parsed === undefined) { unauthorized(response) }
    else {
      if (isAdministrator(log, parsed)) {
        request.publisher = 'administrator'
        handler.apply(this, arguments) }
      else { unauthorized(response) } } } }
