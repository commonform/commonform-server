var getRelations = require('../queries/get-relations')
var internalError = require('./responses/internal-error')
var sendJSON = require('./responses/send-json')

module.exports = function (prefix, parameter) {
  var getMatches = getRelations(prefix)
  return function (request, response, parameters, log, level) {
    var name = decodeURIComponent(parameters[parameter]).toLowerCase()
    getMatches(level, name, function (error, results) {
      /* istanbul ignore if */
      if (error) {
        internalError(response, error)
      } else {
        sendJSON(response, results)
      }
    })
  }
}
