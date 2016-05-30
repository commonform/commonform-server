var badRequest = require('./responses/bad-request')
var getAnnotation = require('../queries/get-annotation')
var internalError = require('./responses/internal-error')
var isUUID = require('../validation/uuid')
var methodNotAllowed = require('./responses/method-not-allowed')
var notFound = require('./responses/not-found')
var sendJSON = require('./responses/send-json')

module.exports = function(request, response, params, log, level) {
  var uuid = params.uuid
  if (!isUUID(uuid)) { badRequest(response, 'invalid UUID') }
  else {
    if (request.method === 'GET') {
      getAnnotation(level, uuid, function(error, value) {
        if (error) {
          /* istanbul ignore else */
          if (error.notFound) { notFound(response) }
          else { internalError(response, error) } }
        else { sendJSON(response, JSON.parse(value).annotation) } }) }
    else { methodNotAllowed(response) } } }