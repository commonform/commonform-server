module.exports = formProjects

var getProjects = require('../queries/get-projects')
var internalError = require('./internal-error')

function formProjects(request, response, parameters, log, level) {
  if (request.method === 'GET') {
    var digest = parameters.digest
    getProjects(level, digest, function(error, projects) {
      if (error) { internalError(response, error) }
      else {
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify(projects)) } }) } }
