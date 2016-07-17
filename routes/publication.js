var badRequest = require('./responses/bad-request')
var conflict = require('./responses/conflict')
var publicationPath = require('../paths/publication')
var exists = require('../queries/exists')
var formKeyFor = require('../keys/form')
var getCurrentPublication = require('../queries/get-current-publication')
var getPublication = require('../queries/get-publication')
var getLatestPublication = require('../queries/get-latest-publication')
var internalError = require('./responses/internal-error')
var isDigest = require('is-sha-256-hex-digest')
var keyForPublication = require('../keys/publication')
var lock = require('level-lock')
var methodNotAllowed = require('./responses/method-not-allowed')
var notFound = require('./responses/not-found')
var parseEdition = require('reviewers-edition-parse')
var readJSONBody = require('./read-json-body')
var requireAuthorization = require('./require-authorization')
var sendJSON = require('./responses/send-json')
var validProject = require('../validation/project')

module.exports = function (request, response) {
  var method = request.method
  if (method === 'GET') serveProject.apply(this, arguments)
  else if (method === 'POST') {
    requireAuthorization(postPublication).apply(this, arguments)
  } else methodNotAllowed(response)
}

function postPublication (request, response, parameters, log, level, write) {
  var publisher = parameters.publisher
  var project = parameters.project
  var edition = parameters.edition
  var parsedEdition = parseEdition(edition)
  if (parsedEdition === false) badRequest(response, 'invalid edition')
  else if (!validProject(project)) {
    badRequest(response, 'invalid project name')
  } else {
    readJSONBody(request, response, function (json) {
      if (json.hasOwnProperty('digest')) {
        var digest = json.digest
        if (!isDigest(digest)) {
          badRequest(response, 'invalid digest')
        } else {
          var publicationKey = keyForPublication(publisher, project, edition)
          var formKey = formKeyFor(digest)
          var unlock = lock(level, publicationKey, 'w')
          /* istanbul ignore if */
          if (!unlock) conflict(response)
          else {
            exists(level, formKey, function (error, formExists) {
              /* istanbul ignore if */
              if (error) {
                unlock()
                internalError(response, error)
              } else {
                if (!formExists) {
                  unlock()
                  badRequest(response, 'unknown form')
                } else {
                  exists(level, publicationKey, function (error, publicationExists) {
                    /* istanbul ignore if */
                    if (error) {
                      unlock()
                      internalError(response, error)
                    } else {
                      if (publicationExists) {
                        unlock()
                        conflict(response)
                      } else {
                        var entry = {
                          type: 'publication',
                          data: {
                            publisher: publisher,
                            project: project,
                            edition: edition,
                            digest: digest
                          }
                        }
                        write(entry, function (error) {
                          unlock()
                          if (error) internalError(error, 'internal error')
                          else {
                            response.statusCode = 204
                            response.setHeader('Location', publicationPath(publisher, project, edition))
                            response.end()
                          }
                        })
                      }
                    }
                  })
                }
              }
            })
          }
        }
      } else badRequest(response, 'invalid project')
    })
  }
}

function serveProject (request, response, parameters, log, level) {
  var publisher = parameters.publisher
  var project = parameters.project
  var edition = parameters.edition
  var fetch
  if (edition === 'current') {
    fetch = getCurrentPublication.bind(this, level, publisher, project)
  } else if (edition === 'latest') {
    fetch = getLatestPublication.bind(this, level, publisher, project)
  } else {
    fetch = getPublication.bind(this, level, publisher, project, edition)
  }
  fetch(function (error, project) {
    /* istanbul ignore if */
    if (error) internalError(response, error)
    else {
      if (project) sendJSON(response, project)
      else notFound(response)
    }
  })
}
