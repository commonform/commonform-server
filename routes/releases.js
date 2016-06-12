var getSortedReleases = require('../queries/get-sorted-editions')
var internalError = require('./responses/internal-error')
var methodNotAllowed = require('./responses/method-not-allowed')
var sendJSON = require('./responses/send-json')

module.exports = function(request, response, parameters, log, level) {
  if (request.method === 'GET') {
    var publisher = parameters.publisher
    var project = parameters.project
    getSortedReleases(level, publisher, project, function(error, editions) {
      /* istanbul ignore if */
      if (error) { internalError(response, error) }
      else {
        var editionNumbers = editions.map(function(object) {
          return object.edition })
        sendJSON(response, editionNumbers) } }) }
  else { methodNotAllowed(response) } }
