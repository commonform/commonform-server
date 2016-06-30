var publicationStringFor = require('../../publication-string')
var mailEachSubscriber = require('./mail-each-subscriber')
var spell = require('reviewers-edition-spell')

/* istanbul ignore next */
module.exports = function (publisher, project, edition) {
  var log = this.log
  var level = this.level
  var publication = {
    publisher: publisher,
    project: project,
    edition: edition
  }
  notifyProjectSubscribers(level, log, publication)
  notifyPublisherSubscribers(level, log, publication)
}

function notifyProjectSubscribers (level, log, publication) {
  var keys = ['project', publication.publisher, publication.project]
  notifySubscribers(keys, level, log, publication)
}

function notifyPublisherSubscribers (level, log, publication) {
  var keys = ['publisher', publication.publisher]
  notifySubscribers(keys, level, log, publication)
}

function notifySubscribers (keys, level, log, publication) {
  var publicationString = publicationStringFor(publication)
  mailEachSubscriber(level, log, keys, function () {
    return {
      subject: publicationString,
      text: [
        publication.publisher + ' published ' +
        publication.project + ' ' + spell(publication.edition)
      ].join('\n')
    }
  })
}
