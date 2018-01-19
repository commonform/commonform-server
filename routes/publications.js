var badRequest = require('./responses/bad-request')
var getPublicationUpgrade = require('../queries/get-publication-upgrade')
var getSorted = require('../queries/get-sorted-publications')
var internalError = require('./responses/internal-error')
var methodNotAllowed = require('./responses/method-not-allowed')
var notFound = require('./responses/not-found')
var parseEdition = require('reviewers-edition-parse')
var sendJSON = require('./responses/send-json')

module.exports = function (request, response, parameters, log, level) {
  if (request.method === 'GET') {
    var publisher = parameters.publisher
    var project = parameters.project
    var upgrade = request.query.upgrade
    if (upgrade) {
      if (!parseEdition(upgrade)) {
        badRequest(response, 'invalid edition')
      } else {
        getPublicationUpgrade(
          level, publisher, project, upgrade,
          function (error, publication) {
            if (error) {
              internalError(response, error)
            } else if (!publication) {
              notFound(response)
            } else {
              sendJSON(response, publication)
            }
          }
        )
      }
    } else {
      getSorted(
        level, publisher, project,
        function (error, publications) {
          /* istanbul ignore if */
          if (error) {
            internalError(response, error)
          } else {
            var editionNumbers = publications.map(function (object) {
              return object.edition
            })
            if (editionNumbers.length === 0) {
              notFound(response)
            } else {
              sendJSON(response, editionNumbers)
            }
          }
        }
      )
    }
  } else {
    methodNotAllowed(response)
  }
}
