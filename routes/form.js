var badRequest = require('./responses/bad-request')
var cache = require('cache-immutable')
var getForm = require('../queries/get-form')
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
        /* istanbul ignore if */
        if (error) internalError(response, error)
        else {
          if (!value) notFound(response)
          else {
            cache(response)
            sendJSON(response, value)
          }
        }
      })
    } else methodNotAllowed(response)
  }
}
