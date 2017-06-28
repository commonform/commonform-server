var checkPassword = require('./check-password')
var internalError = require('./responses/internal-error')
var jwt = require('jsonwebtoken')
var parseAuthorization = require('basic-auth')
var unauthorized = require('./responses/unauthorized')

var JWT_SECRET = process.env.JWT_SECRET
var JWT_ISSUER = process.env.JWT_ISSUER

module.exports = function (handler) {
  return function (request, response, parameters, log, level) {
    var handlerArguments = arguments
    request.publisher = false
    function done () {
      handler.apply(this, handlerArguments)
    }
    var authorization = request.headers.authorization
    if (!authorization) {
      done()
    } else if (authorization.indexOf('Basic') === 0) {
      var parsed = parseAuthorization(request)
      if (parsed === undefined) {
        unauthorized(response)
      } else {
        checkPassword(
          level, parsed.name, parsed.pass, response,
          function (error, valid) {
            /* istanbul ignore if */
            if (error) {
              internalError(response, error)
            } else {
              if (valid) {
                request.publisher = parsed.name
                done()
              } else {
                unauthorized(response)
              }
            }
          }
        )
      }
    } else if (authorization.indexOf('Bearer') === 0) {
      var token = authorization.substring(6)
      jwt.verify(
        token, JWT_SECRET, {issuer: JWT_ISSUER},
        function (error, decoded) {
          if (error || !decoded.publisher) {
            unauthorized(response)
          } else {
            request.publisher = decoded.publisher
            done()
          }
        }
      )
    }
  }
}
