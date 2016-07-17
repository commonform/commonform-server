var badRequest = require('./responses/bad-request')
var cache = require('cache-immutable')
var getForm = require('./get-form')
var internalError = require('./responses/internal-error')
var isDigest = require('is-sha-256-hex-digest')
var methodNotAllowed = require('./responses/method-not-allowed')
var notFound = require('./responses/not-found')
var sendJSON = require('./responses/send-json')

module.exports = function (request, response, params, log, level) {
  var digest = params.digest
  if (!isDigest(digest)) badRequest(response, 'invalid digest')
  else {
    if (request.method === 'GET') {
      getForm(level, digest, function (error, value) {
        if (error) {
          /* istanbul ignore else */
          if (error.notFound) notFound(response)
          else internalError(response, error)
        } else {
          cache(response)
          sendJSON(response, value)
        }
      })
    } else methodNotAllowed(response)
  }
}
