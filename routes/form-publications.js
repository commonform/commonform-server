var getPublications = require('../queries/get-publications')
var internalError = require('./responses/internal-error')

module.exports = function (request, response, parameters, log, level) {
  if (request.method === 'GET') {
    var digest = parameters.digest
    getPublications(level, digest, function (error, publications) {
      /* istanbul ignore if */
      if (error) internalError(response, error)
      else {
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify(publications))
      }
    })
  }
}
