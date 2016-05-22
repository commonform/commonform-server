module.exports = editionForm

var getCurrentEdition = require('../queries/get-current-edition')
var internalError = require('./internal-error')
var methodNotAllowed = require('./method-not-allowed')
var getProject = require('../queries/get-project')
var getLatestEdition = require('../queries/get-latest-edition')

function editionForm(request, response, parameters, log, level) {
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
      if (error) { internalError(response, error) }
      else {
        if (project) {
          response.statusCode = 301
          response.setHeader(
            'Location',
            ( 'https://api.commonform.org/forms/' + project.digest ))
          response.end() }
        else {
          response.statusCode = 404
          response.end() } } }) }
  else { methodNotAllowed(response) } }
