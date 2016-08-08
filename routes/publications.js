var getSorted = require('../queries/get-sorted-publications')
var internalError = require('./responses/internal-error')
var methodNotAllowed = require('./responses/method-not-allowed')
var sendJSON = require('./responses/send-json')

module.exports = function (request, response, parameters, log, level) {
  if (request.method === 'GET') {
    var publisher = parameters.publisher
    var project = parameters.project
    getSorted(
      level, publisher, project,
      function (error, publications) {
        /* istanbul ignore if */
        if (error) {
          internalError(response, error)
        } else {
          var editionNumbers = publications.map(function (object) {
            return object.edition
          })
          sendJSON(response, editionNumbers)
        }
      }
    )
  } else {
    methodNotAllowed(response)
  }
}
