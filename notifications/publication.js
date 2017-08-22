var publicationStringFor = require('../publication-string')
var mailEachSubscriber = require('./mail-each-subscriber')
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
