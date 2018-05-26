var getDependents = require('../queries/get-dependents')
var internalError = require('./responses/internal-error')
var methodNotAllowed = require('./responses/method-not-allowed')
var sendJSON = require('./responses/send-json')

module.exports = function (request, response, parameters, log, level) {
  if (request.method === 'GET') {
    getDependents(
      level, parameters.publisher, parameters.project,
      function (error, parents) {
        /* istanbul ignore if */
        if (error) {
          internalError(response, error)
        } else {
          sendJSON(response, parents)
        }
      }
    )
  } else {
    methodNotAllowed(response)
  }
}
