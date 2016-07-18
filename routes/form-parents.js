var getParents = require('../queries/get-parents')
var internalError = require('./responses/internal-error')
var methodNotAllowed = require('./responses/method-not-allowed')
var sendJSON = require('./responses/send-json')

module.exports = function (request, response, parameters, log, level) {
  if (request.method === 'GET') {
    getParents(level, parameters.digest, function (error, parents) {
      /* istanbul ignore if */
      if (error) internalError(response, error)
      else sendJSON(response, parents)
    })
  } else methodNotAllowed(response) }
