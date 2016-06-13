var releaseStringFor = require('../../release-string')
var mailEachSubscriber = require('./mail-each-subscriber')
var spell = require('reviewers-edition-spell')

/* istanbul ignore next */
module.exports = function(publisher, project, edition) {
  var log = this.log
  var level = this.level
  var release =
    { publisher: publisher,
      project: project,
      edition: edition }
  notifyProjectSubscribers(level, log, release)
  notifyPublisherSubscribers(level, log, release) }

function notifyProjectSubscribers(level, log, release) {
  var keys = [ 'project', release.publisher, release.project ]
  notifySubscribers(keys, level, log, release) }

function notifyPublisherSubscribers(level, log, release) {
  var keys = [ 'publisher', release.publisher ]
  notifySubscribers(keys, level, log, release) }

function notifySubscribers(keys, level, log, release) {
  var releaseString = releaseStringFor(release)
  mailEachSubscriber(level, log, keys, function() {
    return (
      { subject: releaseString,
        text:
          [ ( release.publisher + ' published ' +
              release.project + ' ' + spell(release.edition)) ]
            .join('\n') } ) }) }
