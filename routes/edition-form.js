var formPath = require('../paths/form')
var getCurrentEdition = require('../queries/get-current-release')
var getEdition = require('../queries/get-release')
var getLatestEdition = require('../queries/get-latest-release')
var internalError = require('./responses/internal-error')
var methodNotAllowed = require('./responses/method-not-allowed')

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
      fetch = getEdition.bind(this, level, publisher, project, edition) }
    fetch(function(error, edition) {
      /* istanbul ignore if */
      if (error) { internalError(response, error) }
      else {
        response.statusCode = 301
        response.setHeader('Location', formPath(edition.digest))
        response.end() } }) }
  else { methodNotAllowed(response) } }
