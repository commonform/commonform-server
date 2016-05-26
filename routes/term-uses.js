module.exports = termUses

var getTermUses = require('../queries/get-term-uses')
var internalError = require('./responses/internal-error')
var methodNotAllowed = require('./responses/method-not-allowed')
var sendJSON = require('./responses/send-json')

function termUses(request, response, parameters, log, level) {
  if (request.method === 'GET') {
    var term = parameters.term
    getTermUses(level, term, function(error, digests) {
      /* istanbul ignore if */
      if (error) { internalError(response, error) }
      else { sendJSON(response, digests) } }) }
  else { methodNotAllowed(response) } }
