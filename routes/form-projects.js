var getProjects = require('../queries/get-projects')
var internalError = require('./responses/internal-error')

module.exports = function(request, response, parameters, log, level) {
  if (request.method === 'GET') {
    var digest = parameters.digest
    getProjects(level, digest, function(error, projects) {
      /* istanbul ignore if */
      if (error) { internalError(response, error) }
      else {
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify(projects)) } }) } }
