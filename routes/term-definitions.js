module.exports = termDefinitions

var getTermDefinitions = require('../queries/get-term-definitions')
var internalError = require('./responses/internal-error')
var methodNotAllowed = require('./responses/method-not-allowed')
var sendJSON = require('./responses/send-json')

function termDefinitions(request, response, parameters, log, level) {
  if (request.method === 'GET') {
    var term = parameters.term
    getTermDefinitions(level, term, function(error, digests) {
      /* istanbul ignore if */
      if (error) { internalError(response, error) }
      else { sendJSON(response, digests) } }) }
  else { methodNotAllowed(response) } }
