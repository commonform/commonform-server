var badRequest = require('./responses/bad-request')
var conflict = require('./responses/conflict')
var exists = require('../queries/exists')
var getCurrent = require('../queries/get-current-publication')
var getForm = require('../queries/get-form')
var getLatestPublication = require('../queries/get-latest-publication')
var getPublication = require('../queries/get-publication')
var internalError = require('./responses/internal-error')
var keyForPublication = require('../keys/publication')
var mailgun = require('../mailgun')
var methodNotAllowed = require('./responses/method-not-allowed')
var notFound = require('./responses/not-found')
var parseEdition = require('reviewers-edition-parse')
var publicationPath = require('../paths/publication')
var readJSONBody = require('./read-json-body')
var requireAuthorization = require('./require-authorization')
var sendIncludedNotifications = require('../notifications/included')
var sendJSON = require('./responses/send-json')
var sendNotifications = require('../notifications/publication')
var validProject = require('../validation/project')
var validPublication = require('../validation/publication')
var validReleaseNotes = require('../validation/release-notes')
var validSignaturePages = require('../validation/signature-pages')
var validTitle = require('../validation/title')
var validateDirections = require('commonform-validate-directions')

module.exports = function (request, response) {
  var method = request.method
  if (method === 'GET') {
    serveProject.apply(this, arguments)
  } else if (method === 'POST') {
    requireAuthorization(postPublication).apply(this, arguments)
  } else {
    methodNotAllowed(response)
  }
}

function postPublication (
  request, response, parameters, log, level, write
) {
  var publisher = parameters.publisher
  var project = parameters.project
  var edition = parameters.edition
  var parsedEdition = parseEdition(edition)
  if (parsedEdition === false) {
    badRequest(response, 'invalid edition')
  } else if (!validProject(project)) {
    badRequest(response, 'invalid project name')
  } else {
    readJSONBody(request, response, function (json) {
      if (json.hasOwnProperty('digest')) {
        var digest = json.digest
        if (!validPublication(json)) {
          badRequest(response, 'invalid publication')
        } else if (
          json.signaturePages &&
          !validSignaturePages(json.signaturePages)
        ) {
          badRequest(response, 'invalid signature pages')
        } else if (
          json.title &&
          !validTitle(json.title)
        ) {
          badRequest(response, 'invalid title')
        } else if (
          json.notes &&
          !validReleaseNotes(json.notes)
        ) {
          badRequest(response, 'invalid release notes')
        } else {
          var publicationKey = keyForPublication(
            publisher, project, edition
          )
          getForm(level, digest, function (error, form) {
            /* istanbul ignore if */
            if (error) {
              internalError(response, error)
            } else {
              if (!form) {
                badRequest(response, 'unknown form')
              } else {
                if (json.hasOwnProperty('directions')) {
                  var directionsErrors = validateDirections(
                    form, json.directions
                  )
                  if (directionsErrors.length !== 0) {
                    return badRequest(response, 'invalid directions')
                  }
                }
                exists(
                  level, publicationKey,
                  function (error, publicationExists) {
                    /* istanbul ignore if */
                    if (error) {
                      internalError(response, error)
                    } else {
                      if (publicationExists) {
                        conflict(response)
                      } else {
                        var entry = {
                          type: 'publication',
                          data: {
                            publisher: publisher,
                            project: project,
                            edition: edition,
                            digest: digest,
                            timestamp: new Date().toISOString()
                          }
                        }
                        ;['title', 'signaturePages', 'notes', 'directions']
                          .forEach(function (key) {
                            if (json[key]) {
                              entry.data[key] = json[key]
                            }
                          })
                        write(entry, function (error) {
                          /* istanbul ignore if */
                          if (error) {
                            internalError(response, error)
                          } else {
                            response.statusCode = 204
                            var path = publicationPath(
                              publisher, project, edition
                            )
                            response.setHeader('Location', path)
                            response.end()
                            /* istanbul ignore else */
                            if (mailgun) {
                              sendIncludedNotifications(
                                request.configuration,
                                publisher, project, edition, digest,
                                log, level
                              )
                              sendNotifications(
                                request.configuration,
                                publisher, project, edition,
                                log, level
                              )
                            }
                          }
                        })
                      }
                    }
                  }
                )
              }
            }
          })
        }
      } else {
        badRequest(response, 'invalid project')
      }
    })
  }
}

function serveProject (request, response, parameters, log, level) {
  var publisher = parameters.publisher
  var project = parameters.project
  var edition = parameters.edition
  var fetch
  if (edition === 'current') {
    fetch = getCurrent.bind(
      this, level, publisher, project
    )
  } else if (edition === 'latest') {
    fetch = getLatestPublication.bind(
      this, level, publisher, project
    )
  } else {
    fetch = getPublication.bind(
      this, level, publisher, project, edition
    )
  }
  fetch(function (error, project) {
    /* istanbul ignore if */
    if (error) {
      internalError(response, error)
    } else {
      if (!project) {
        notFound(response)
      } else {
        sendJSON(response, project)
      }
    }
  })
}
