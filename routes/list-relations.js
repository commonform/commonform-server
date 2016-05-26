var getRelations = require('../queries/get-relations')
var internalError = require('./responses/internal-error')
var sendJSON = require('./responses/send-json')

module.exports = function(prefix) {
  var getMatches = getRelations(prefix)
  return function(request, response, parameters, log, level) {
    var name = parameters.name
    getMatches(level, name, function(error, results) {
      if (error) { internalError(response, error) }
      else { sendJSON(response, results) } }) } }
