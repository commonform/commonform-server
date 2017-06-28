var checkPassword = require('./check-password')
var forbidden = require('./responses/forbidden')
var internalError = require('./responses/internal-error')
var isAdministrator = require('./is-administrator')
var jwt = require('jsonwebtoken')
var parseAuthorization = require('basic-auth')
var unauthorized = require('./responses/unauthorized')

var JWT_SECRET = process.env.JWT_SECRET
var JWT_ISSUER = process.env.JWT_ISSUER

module.exports = function (handler, anyUser) {
  return function (request, response, parameters, log, level) {
    var handlerArguments = arguments
    function allow () {
      handler.apply(this, handlerArguments)
    }
    var publisher = parameters.hasOwnProperty('subscriber')
      ? parameters.subscriber
      : parameters.publisher
    var authorization = request.headers.authorization
    if (!authorization) {
      unauthorized(response)
    } if (authorization.indexOf('Basic') === 0) {
      var parsed = parseAuthorization(request)
      if (parsed === undefined) {
        unauthorized(response)
      } else {
        if (isAdministrator(log, parsed)) {
          request.publisher = 'administrator'
          allow()
        } else {
          if (!anyUser && parsed.name !== publisher) {
            forbidden(response)
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
                    allow()
                  } else {
                    unauthorized(response)
                  }
                }
              }
            )
          }
        }
      }
    } else if (authorization.indexOf('Bearer') === 0) {
      var token = authorization.substring(6)
      jwt.verify(
        token, JWT_SECRET, {issuer: JWT_ISSUER},
        function (error, decoded) {
          if (error || !decoded.publisher) {
            unauthorized(response)
          } else {
            if (!anyUser && decoded.publisher !== publisher) {
              forbidden(response)
            } else {
              request.publisher = decoded.publisher
              allow()
            }
          }
        }
      )
    } else {
      unauthorized(response)
    }
  }
}
