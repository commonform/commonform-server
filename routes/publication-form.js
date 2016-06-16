var formPath = require('../paths/form')
var getCurrentPublication = require('../queries/get-current-publication')
var getPublication = require('../queries/get-publication')
var getLatestPublication = require('../queries/get-latest-publication')
var internalError = require('./responses/internal-error')
var methodNotAllowed = require('./responses/method-not-allowed')

module.exports = function(request, response, parameters, log, level) {
  if (request.method === 'GET') {
    var publisher = parameters.publisher
    var project = parameters.project
    var edition = parameters.edition
    var fetch
    if (edition === 'current') {
      fetch = getCurrentPublication.bind(this, level, publisher, project) }
    else if (edition === 'latest') {
      fetch = getLatestPublication.bind(this, level, publisher, project) }
    else {
      fetch = getPublication.bind(this, level, publisher, project, edition) }
    fetch(function(error, edition) {
      /* istanbul ignore if */
      if (error) { internalError(response, error) }
      else {
        response.statusCode = 301
        response.setHeader('Location', formPath(edition.digest))
        response.end() } }) }
  else { methodNotAllowed(response) } }