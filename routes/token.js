var JWT_STRINGS = require('../jwt-strings')
var internalError = require('./responses/internal-error')
var jwt = require('jsonwebtoken')
var methodNotAllowed = require('./responses/method-not-allowed')
var requireAuthorization = require('./require-authorization')

module.exports = function (request, response, parameters, log) {
  if (request.method === 'GET') {
    requireAuthorization(issueToken, true).apply(this, arguments)
  } else {
    methodNotAllowed(response)
  }
}

function issueToken (request, response, parameters, log) {
  jwt.sign(
    {publisher: request.publisher},
    JWT_STRINGS.SECRET,
    {
      expiresIn: '7d',
      issuer: JWT_STRINGS.ISSUER
    },
    function (error, token) {
      if (error) {
        internalError(response)
      } else {
        response.end(token)
      }
    }
  )
}
