module.exports = publisherProjects

var internalError = require('./responses/internal-error')
var getPublisherProjects = require('../queries/get-publisher-projects')

function publisherProjects(request, response, parameters, log, level) {
  if (request.method === 'GET') {
    var publisher = parameters.publisher
    getPublisherProjects(level, publisher, function(error, projects) {
      /* istanbul ignore if */
      if (error) { internalError(response, error) }
      else {
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify(projects)) } }) } }
