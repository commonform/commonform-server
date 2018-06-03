var badRequest = require('./responses/bad-request')
var conflict = require('./responses/conflict')
var descriptionKeyFor = require('../keys/description')
var getDescription = require('../queries/get-description')
var getPublisherProjects = require('../queries/get-publisher-projects')
var internalError = require('./responses/internal-error')
var lock = require('level-lock')
var methodNotAllowed = require('./responses/method-not-allowed')
var notFound = require('./responses/not-found')
var readJSONBody = require('./read-json-body')
var requireAdministrator = require('./require-administrator')
var requireAuthorization = require('./require-authorization')
var sendJSON = require('./responses/send-json')
var validDescription = require('../validation/description')

module.exports = function (request, response) {
  if (request.method === 'GET') {
    handleGetDescription.apply(this, arguments)
  } else if (request.method === 'POST') {
    requireAdministrator(putDescription).apply(this, arguments)
  } else if (request.method === 'PUT') {
    requireAuthorization(putDescription).apply(this, arguments)
  } else {
    methodNotAllowed(response)
  }
}

function handleGetDescription (
  request, response, parameters, log, level
) {
  var publisher = parameters.publisher
  var project = parameters.project
  getDescription(level, publisher, project, function (error, stored) {
    /* istanbul ignore if */
    if (error) return internalError(response, error)
    var description
    if (!stored) description = null
    else description = stored
    sendJSON(response, JSON.stringify(description))
  })
}

function putDescription (
  request, response, parameters, log, level, write
) {
  var publisher = parameters.publisher
  var project = parameters.project
  readJSONBody(request, response, function (json) {
    if (!validDescription(json)) {
      return badRequest(response, 'invalid description')
    }
    var key = descriptionKeyFor(publisher, project)
    var unlock = lock(level, key, 'w')
    /* istanbul ignore if */
    if (!unlock) return conflict(response)
    getPublisherProjects(level, publisher, function (error, projects) {
      /* istanbul ignore if */
      if (error) return internalError(response, error)
      if (projects.indexOf(project) === -1) {
        unlock()
        return notFound(response)
      }
      var entry = {
        type: 'description',
        data: {
          publisher: publisher,
          project: project,
          description: json
        }
      }
      write(entry, function (error) {
        unlock()
        /* istanbul ignore if */
        if (error) return internalError(error, 'internal error')
        response.statusCode = 204
        response.end()
      })
    })
  })
}
