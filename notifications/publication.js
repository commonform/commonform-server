var getDependents = require('../queries/get-dependents')
var mailEachSubscriber = require('./mail-each-subscriber')
var publicationStringFor = require('../publication-string')
var spell = require('reviewers-edition-spell')

module.exports = function (
  configuration, publisher, project, edition, log, level
) {
  var publication = {
    publisher: publisher,
    project: project,
    edition: edition
  }
  notifyProjectSubscribers(configuration, level, log, publication)
  notifyPublisherSubscribers(configuration, level, log, publication)
  notifyDependentFormSubscribers(configuration, level, log, publication)
}

function notifyProjectSubscribers (
  configuration, level, log, publication
) {
  var keys = [
    'publisher', publication.publisher,
    'project', publication.project
  ]
  notifySubscribers(configuration, keys, level, log, publication)
}

function notifyPublisherSubscribers (
  configuration, level, log, publication
) {
  var keys = ['publisher', publication.publisher]
  notifySubscribers(configuration, keys, level, log, publication)
}

function notifySubscribers (
  configuration, keys, level, log, publication
) {
  var publicationString = publicationStringFor(publication)
  mailEachSubscriber(level, log, keys, function () {
    return {
      subject: publicationString,
      text: [
        publication.publisher + ' published ' +
        publication.project + ' ' + spell(publication.edition)
      ]
        .join('\n')
    }
  })
}

function notifyDependentFormSubscribers (
  configuration, level, log, publication
) {
  var publicationString = publicationStringFor(publication)
  getDependents(level, publication.publisher, publication.project, function (error, dependents) {
    if (error) return log.error(error)
    dependents.forEach(function (dependent) {
      var digest = dependent.digest
      var keys = ['digest', digest]
      mailEachSubscriber(level, log, keys, function () {
        return {
          subject: 'New Edition of ' + publicationString,
          text: [
            publication.publisher + ' published ' +
            publication.project + ' ' + spell(publication.edition) +
            ', a component of ' +
            digest
          ].join('\n')
        }
      })
    })
  })
}
