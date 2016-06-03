var editionStringFor = require('../../edition-string')
var getParents = require('../../queries/get-parents')
var getProjects = require('../../queries/get-projects')
var getPublisher = require('../../queries/get-publisher')
var getSubscribers = require('../../queries/get-subscribers')
var mailgun = require('../../mailgun')

/* istanbul ignore next */
module.exports = function(annotation) {
  var log = this.log
  var level = this.level
  notifyFormSubscribers(level, log, annotation)
  notifyEditionSubscribers(level, log, annotation)
  notifyAnnotationSubscribers(level, log, annotation) }

function notifyEditionSubscribers(level, log, annotation) {
  getProjects(level, annotation.context, function(error, projects) {
    projects.forEach(function(project) {
      var editionString = editionStringFor(project)
      var keys =
        [ 'edition',
          project.publisher, project.project, project.edition ]
      getSubscribers(level, keys, function(error, subscribers) {
        /* istanbul ignore if */
        if (error) { log.error(error) }
        else {
          subscribers.forEach(function(subscriber) {
            getPublisher(level, subscriber, function(error, subscriber) {
              /* istanbul ignore if */
              if (error) { log.error(error) }
              else {
                var message =
                  { subject: ( 'Annotation to ' + editionString ),
                    text:
                      [ ( annotation.publisher +
                          ' has made a new annotation to ' +
                          editionString ) ]
                      .join('\n') }
                sendEMail(subscriber, message, log) } }) }) } }) }) }) }

function notifyFormSubscribers(level, log, annotation) {
  var digest = annotation.context
  getParents(level, digest, function(error, parents) {
    /* istanbul ignore if */
    if (error) { log.error(error) }
    else {
      [ digest ].concat(parents).forEach(function(context) {
        var keys = [ 'form', context ]
        getSubscribers(level, keys, function(error, subscribers) {
          /* istanbul ignore if */
          if (error) { log.error(error) }
          else {
            subscribers.forEach(function(subscriber) {
              getPublisher(level, subscriber, function(error, subscriber) {
                /* istanbul ignore if */
                if (error) { log.error(error) }
                else {
                  var message =
                    { subject: ( 'Annotation to ' + annotation.digest ),
                      text:
                        [ ( annotation.publisher +
                            ' has made a new annotation to ' +
                            annotation.form ) ]
                        .join('\n') }
                  sendEMail(subscriber, message, log) } }) }) } }) }) } }) }

function notifyAnnotationSubscribers(level, log, annotation) {
  var parents = annotation.replyTo
  parents.forEach(function(parent) {
    var keys = [ 'annotation', parent ]
    getSubscribers(level, keys, function(error, subscribers) {
      /* istanbul ignore if */
      if (error) { log.error(error) }
      else {
        subscribers.forEach(function(subscriber) {
          getPublisher(level, subscriber, function(error, subscriber) {
            /* istanbul ignore if */
            if (error) { log.error(error) }
            else {
              var message =
                { subject: ( 'Reply to annotation to ' + annotation.digest ),
                  text:
                    [ ( annotation.publisher + ' has replied to annotation ' + parent ) ]
                    .join('\n') }
              sendEMail(subscriber, message, log) } }) }) } }) }) }

function sendEMail(subscriber, message, log) {
  /* istanbul ignore if */
  if (typeof subscriber.email !== 'string') {
    log.error(new Error('No e-mail for ' + subscriber.name)) }
  else {
    message.to = subscriber.email
    mailgun(message, log) } }
