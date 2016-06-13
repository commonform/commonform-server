var editionStringFor = require('../../edition-string')
var getPublisher = require('../../queries/get-publisher')
var getSubscribers = require('../../queries/get-subscribers')
var sendEMail = require('./send-email')

module.exports = function(publisher, project, edition, digest) {
  var log = this.log
  var level = this.level
  var keys = [ 'form', digest ]
  getSubscribers(level, keys, function(error, subscribers) {
    /* istanbul ignore if */
    if (error) { log.error(error) }
    else {
      subscribers.forEach(function(subscriber) {
        getPublisher(level, subscriber, function(error, subscriber) {
          /* istanbul ignore if */
          if (error) { log.error(error) }
          else {
            var release =
              { publisher: publisher,
                project: project,
                edition: edition }
            var releaseString = editionStringFor(release)
            var message =
              { subject: ( digest + ' in ' + releaseString ),
                text:
                  [ ( digest + ' was included in ' + releaseString ) ]
                  .join('\n') }
            sendEMail(subscriber, message, log) } }) }) } }) }
