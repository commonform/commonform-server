module.exports = makeRequestHandler

// EventEmitter2 supports wildcard event handlers and `.onAny()`, which
// is used for logging.
var EventEmitter = require('eventemitter2').EventEmitter2
var formKeyFor = require('./keys/form')
var formToProjectKey = require('./keys/form-to-project')
var normalize = require('commonform-normalize')
var notFound = require('./routes/not-found')
var putForm = require('./queries/put-form')
var url = require('url')
var uuid = require('uuid')

function makeRequestHandler(log, level) {
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

    // A new form has been added to the library.
    .on('form', function emitEventsForChildren(form, digest, normalized, seen) {
      /* istanbul ignore if */
      if (seen.includes(digest)) {
        eventLog.error({ event: 'collision', digest: digest, seen: seen }) }
      else {
        seen.push(digest)
        form.content.forEach(function(element, index) {
          if (element.hasOwnProperty('form')) {
            // The denormalized object, to be stored in LevelUP.
            var child = element.form
            // The normalized object, which has the digests of any child forms.
            var childDigest = normalized[digest].content[index].digest
            putForm(level, childDigest, child, false, function(error) {
              /* istanbul ignore if */
              if (error) { eventLog.error(error) }
              else {
                // Trigger an additional form events for this child form.
                // This is indirectly recursive, since the event emitter
                // will trigger this handler for again for the new event.
                setImmediate(function recurse() {
                  emit('form', child, childDigest, normalized, seen) }) } }) } }) } })

    .on('project', function(publisher, project, edition, digest, normalized) {
      if (normalized === undefined) {
        level.get(formKeyFor(digest), function(error, json) {
          if (error) { eventBus.error(error) }
          else { recurseChildren(digest, normalize(JSON.parse(json).form)) } }) }
      else { recurseChildren(digest, normalized) }
      function recurseChildren(digest, normalized) {
        var root = ( digest === normalized.root )
        var key = formToProjectKey(digest, publisher, project, edition, root)
        level.put(key, undefined, function(error) {
          if (error) { eventLog.error(error) } })
        normalized[digest].content.forEach(function(element) {
          if (element.hasOwnProperty('digest')) {
            var childDigest = element.digest
            var childKey = formToProjectKey(childDigest, publisher, project, edition, false)
            level.put(childKey, undefined, function(error) {
              if (error) { eventLog.error(error) } })
            setImmediate(function() {
              emit('project', publisher, project, edition, childDigest, normalized) }) } }) } })

  // Routing
  var routes = require('./routes')(emit)

  var TIMEOUT = ( parseInt(process.env.TIMEOUT) || 5000 )

  return function requestHandler(request, response) {
    // Create a Pino child log for this HTTP response, marked with a
    // random UUID.
    response.log = log.child({ log: uuid.v4() })
    response.log.info(request)
    response.on('end', function() { response.log.info(response) })

    response.setTimeout(TIMEOUT, function() {
      response.log.error({ event: 'timeout' })
      response.statusCode = 408
      response.removeAllListeners()
      response.end() })

    // Route the request.
    var parsed = url.parse(request.url)
    var route = routes.get(parsed.path)
    if (route.handler) {
      route.handler(request, response, route.params, log, level) }
    else {
      notFound(response) } } }
