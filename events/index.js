var EventEmitter = require('events').EventEmitter
var indexAnnotation = require('./index-annotation')
var indexDigest = require('./index-digest')
var indexForm = require('./index-form')
var indexFormChildren = require('./index-form-children')
var indexPublisher = require('./index-publisher')
var mailgun = require('../mailgun')
var onForm = require('./form')
var onProject = require('./project')
var onProjectForm = require('./project-form')
var sendAnnotationNotifications = require('./notifications/annotation')
var sendIncludedNotifications = require('./notifications/included')
var sendProjectNotifications = require('./notifications/project')
var subscribed = require('./subscribed')
var unsubscribed = require('./unsubscribed')

module.exports = function(log, level) {
  // Create a Pino child log for events.
  var eventLog = log.child({ log: 'events' })

  // An event bus. Used to trigger indexing and other processing of form
  // and project data posted by users.
  var eventBus = new EventEmitter
  eventBus.level = level
  eventBus.log = eventLog

  // Log every event when emitted.
  var eventNames =
    [ 'annotation', 'form', 'project',
      'projectForm', 'subscribed', 'unsubscribed' ]
  eventNames.forEach(function(eventName) {
    eventBus.on(eventName, function() {
      eventLog.info({ event: eventName }) }) })

  eventBus
    .on('form', onForm)
    .on('project', onProject)
    .on('project', indexPublisher)
    .on('projectForm', onProjectForm)
    .on('projectForm', indexForm)
    .on('projectForm', indexFormChildren)
    .on('projectForm', indexDigest)
    .on('annotation', indexAnnotation)
    .on('subscribed', subscribed)
    .on('unsubscribed', unsubscribed)

  if (mailgun) {
    eventBus
      .on('annotation', sendAnnotationNotifications)
      .on('project', sendProjectNotifications)
      .on('projectForm', sendIncludedNotifications) }

  return eventBus }
