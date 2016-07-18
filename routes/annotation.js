var getAnnotation = require('../queries/get-annotation')
var internalError = require('./responses/internal-error')
var isUUID = require('../validation/uuid')
var methodNotAllowed = require('./responses/method-not-allowed')
var notFound = require('./responses/not-found')
var sendJSON = require('./responses/send-json')

module.exports = function (request, response, params, log, level) {
  if (request.method === 'GET') {
    var uuid = params.uuid
    if (!isUUID(uuid)) notFound(response)
    else {
      getAnnotation(level, uuid, function (error, annotation) {
        /* istanbul ignore if */
        if (error) internalError(response, error)
        else {
          if (!annotation) notFound(response, error)
          else sendJSON(response, annotation)
        }
      })
    }
  } else methodNotAllowed(response)
}
