var getCurrentEdition = require('../queries/get-current-edition')
var internalError = require('./responses/internal-error')
var methodNotAllowed = require('./responses/method-not-allowed')
var getProject = require('../queries/get-project')
var getLatestEdition = require('../queries/get-latest-edition')

module.exports = function(request, response, parameters, log, level) {
  if (request.method === 'GET') {
    var publisher = parameters.publisher
    var project = parameters.project
    var edition = parameters.edition
    var fetch
    if (edition === 'current') {
      fetch = getCurrentEdition.bind(this, level, publisher, project) }
    else if (edition === 'latest') {
      fetch = getLatestEdition.bind(this, level, publisher, project) }
    else {
      fetch = getProject.bind(this, level, publisher, project, edition) }
    fetch(function(error, project) {
      /* istanbul ignore if */
      if (error) { internalError(response, error) }
      else {
        response.statusCode = 301
        response.setHeader(
          'Location',
          ( 'https://api.commonform.org/forms/' + project.digest ))
        response.end() } }) }
  else { methodNotAllowed(response) } }
