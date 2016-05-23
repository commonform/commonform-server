module.exports = projectEditions

var getSortedEditions = require('../queries/get-sorted-editions')
var internalError = require('./responses/internal-error')
var methodNotAllowed = require('./responses/method-not-allowed')
var sendJSON = require('./responses/send-json')

function projectEditions(request, response, parameters, log, level) {
  if (request.method === 'GET') {
    var publisher = parameters.publisher
    var project = parameters.project
    getSortedEditions(level, publisher, project, function(error, editions) {
      if (error) { internalError(response, error) }
      else {
        var editionNumbers = editions.map(function(object) {
          return object.edition })
        sendJSON(response, editionNumbers) } }) }
  else { methodNotAllowed(response) } }
