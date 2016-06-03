var editionStringFor = require('../../edition-string')
var getPublisher = require('../../queries/get-publisher')
var getSubscribers = require('../../queries/get-subscribers')
var mailgun = require('../../mailgun')
var spell = require('reviewers-edition-spell')

/* istanbul ignore next */
module.exports = function(publisher, project, edition) {
  var log = this.log
  var level = this.level
  var object =
    { publisher: publisher,
      project: project,
      edition: edition }
  notifyProjectSubscribers(level, log, object) }

function notifyProjectSubscribers(level, log, object) {
  var editionString = editionStringFor(object)
  var keys = [ 'project', object.publisher, object.project ]
  getSubscribers(level, keys, function(error, subscribers) {
    /* istanbul ignore if */
    if (error) { log.error(error) }
    else {
      subscribers.forEach(function(subscriber) {
        getPublisher(level, subscriber, function(error, subscriber) {
          /* istanbul ignore if */
          if (error) { log.error(error) }
          else {
            /* istanbul ignore if */
            if (typeof subscriber.email !== 'string') {
              log.error(new Error('No e-mail for ' + subscriber.name)) }
            else {
              var message =
                { to: subscriber.email,
                  subject: ( editionString ),
                  text:
                    [ ( object.publisher + ' has published ' +
                        object.project + ' ' + spell(object.edition)) ]
                    .join('\n') }
              mailgun(message, log) } } }) }) } }) }
