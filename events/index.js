var EventEmitter = require('events').EventEmitter
var backupForm = require('./backup/form')
var backupProject = require('./backup/project')
var indexForm = require('./index-form')
var indexDigest = require('./index-digest')
var indexFormChildren = require('./index-form-children')
var indexPublisher = require('./index-publisher')
var onForm = require('./form')
var onProject = require('./project')
var onProjectForm = require('./project-form')

var s3 = require('../s3')

module.exports = function(log, level) {
  // Create a Pino child log for events.
  var eventLog = log.child({ log: 'events' })

  // An event bus. Used to trigger indexing and other processing of form
  // and project data posted by users.
  var eventBus = new EventEmitter
  eventBus.level = level
  eventBus.log = eventLog

  eventBus
    .on('form', onForm)
    .on('project', onProject)
    .on('project', indexPublisher)
    .on('projectForm', onProjectForm)
    .on('projectForm', indexForm)
    .on('projectForm', indexFormChildren)
    .on('projectForm', indexDigest)

  /* istanbul ignore if */
  if (s3) {
    eventLog.info({ event: 'enabling s3' })
    // Create a Pino child log for S3 backup.
    eventBus.on('form', backupForm)
    eventBus.on('project', backupProject) }

  // Log every event when emitted.
  eventBus.eventNames().forEach(function(eventName) {
    eventBus.prependListener(eventName, function() {
      eventLog.info({ event: eventName }) }) })

  return eventBus }
