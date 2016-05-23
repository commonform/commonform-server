module.exports = makeEventBus

var EventEmitter = require('eventemitter2').EventEmitter2
var onForm = require('./form')
var onProject = require('./project')

function makeEventBus(log, level) {
  // Create a Pino child log for events.
  var eventLog = log.child({ log: 'events' })

  // An event bus. Used to trigger indexing and other processing of form
  // and project data posted by users.
  var eventBus = new EventEmitter
  var emit = eventBus.emit.bind(eventBus)

  eventBus
    // Log all event bus activity.
    .onAny(function(event) {
      eventLog.info({ event: 'emit', name: event }) })
    .on('form', onForm.bind(this, emit, level, log))
    .on('project', onProject.bind(this, emit, level, log))

  return eventBus }
