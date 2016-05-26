module.exports = makeEventBus

var EventEmitter = require('events').EventEmitter
var backupForm = require('./backup/form')
var backupProject = require('./backup/project')
var onForm = require('./form')
var onProject = require('./project')

var s3 = require('../s3')

function makeEventBus(log, level) {
  // Create a Pino child log for events.
  var eventLog = log.child({ log: 'events' })

  // An event bus. Used to trigger indexing and other processing of form
  // and project data posted by users.
  var eventBus = new EventEmitter
  var emit = eventBus.emit.bind(eventBus)

  eventBus
    .on('form', onForm.bind(this, emit, level, log))
    .on('project', onProject.bind(this, emit, level, log))

  if (s3) {
    eventLog.info({ event: 'enabling s3' })
    // Create a Pino child log for S3 backup.
    var s3Log = log.child({ log: 's3' })
    eventBus.on('form', backupForm.bind(this, s3Log))
    eventBus.on('project', backupProject.bind(this, s3Log)) }

  return eventBus }
