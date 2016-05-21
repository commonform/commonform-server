module.exports = handleHTTPRequest

// EventEmitter2 supports wildcard event handlers and `.onAny()`, which
// is used for logging.
var EventEmitter = require('eventemitter2').EventEmitter2
var concat = require('concat-stream')
var formKey = require('./form-key')
var isDigest = require('is-sha-256-hex-digest')
var normalize = require('commonform-normalize')
var parseJSON = require('json-parse-errback')
var thrice = require('./thrice')
var url = require('url')
var uuid = require('uuid')
var validForm = require('commonform-validate').form

var VERSION = require('./package.json').version
// Compute the JSON with metadata bout the service for GET /, and just
// keep it in memory.
var SERVICE_AND_VERSION = JSON.stringify(
  { service: require('./package.json').name,
    version: VERSION })

function handleHTTPRequest(bole, level) {
  // Create a Bole sub-log for events.
  var eventLog = bole('events')
  // An event bus. Used to trigger indexing and other processing of form
  // and project data posted by users.
  var eventBus = new EventEmitter
  var emit = eventBus.emit.bind(eventBus)
  eventBus
    // Log all event bus activity.
    .onAny(function(event) {
      eventLog.info({ event: 'emit', name: event }) })
    // A new form has been added to the library.
    // TODO: Cycle checking.  Use a `seen` array parameter with digests.
    .on('form', function emitEventsForChildren(form, digest, normalized) {
      form.content.forEach(function(element, index) {
        if (element.hasOwnProperty('form')) {
          // The denormalized object, to be stored in LevelUP.
          var child = element.form
          // The normalized object, which has the digests of any child forms.
          var childDigest = normalized[digest].content[index].digest
          putForm(level, childDigest, child, function(error) {
            /* istanbul ignore if */
            if (error) { eventLog.error(error) }
            else {
              // Trigger an additional form events for this child form.
              // This is indirectly recursive, since the event emitter
              // will trigger this handler for again for the new event.
              setImmediate(function recurse() {
                emit('form', child, childDigest, normalized) }) } }) } }) })

  return function(request, response) {
    // Create a Bole sub-log for this HTTP response, marked with a
    // random UUID.
    response.log = bole(uuid.v4())
    response.log.info(request)

    // Route the request.
    var method = request.method
    var parsed = url.parse(request.url)
    var pathname = parsed.pathname

    if (pathname === '/') {
      // GET /
      if (method === 'GET') { sendJSON(response, SERVICE_AND_VERSION) }
      else { methodNotAllowed(response) } }

    else if (pathname === '/forms') {
      // POST /forms
      if (method === 'POST') {
        request.pipe(concat(function(buffer) {
          parseJSON(buffer, function(error, form) {
            if (error) { badRequest(response, 'invalid JSON') }
            else {
              if (!validForm(form)) { badRequest(response, 'invalid form') }
              else {
                var normalized = normalize(form)
                var digest = normalized.root
                response.log.info({ digest: digest })
                putForm(level, digest, form, function(error) {
                  /* istanbul ignore if */
                  if (error) { internalError(response, error) }
                  else {
                    response.log.info({ event: 'form' })
                    response.statusCode = 201
                    response.setHeader('location', ( '/forms/' + digest ))
                    response.end()
                    // Emit an event for the new form. This will trigger
                    // indexing and other processing by event handlers
                    // on the event emitter.
                    emit('form', form, digest, normalized) } }) } } }) })) }
      else { methodNotAllowed(response) } }

    else if (pathname.startsWith('/forms/')) {
      var digest = pathname.substring('/forms/'.length)
      if (!isDigest(digest)) { badRequest(response, 'invalid digest') }
      else {
        // GET /forms/$digest
        if (method === 'GET') {
          getForm(level, digest, function(error, value) {
            if (error) {
              /* istanbul ignore else */
              if (error.notFound) { notFound(response) }
              else { internalError(response, error) } }
            else { sendJSON(response, JSON.parse(value).form) } }) }
        else { methodNotAllowed(response) } } }

    else { notFound(response) } } }

// Shorthand handlers for various response types:

function sendJSON(response, body) {
  response.setHeader('content-type', 'application/json')
  response.end(( typeof body === 'string' ) ? body : JSON.stringify(body)) }

function badRequest(response, message) {
  response.log.info({ event: message })
  response.statusCode = 400
  response.end(message) }

/* istanbul ignore next */
function internalError(response, error) {
  response.log.error(error)
  justEnd(500, response) }

function justEnd(status, response) {
  response.statusCode = status
  response.end() }

var notFound = justEnd.bind(this, 404)
var methodNotAllowed = justEnd.bind(this, 405)

// Helper functions for reading and writing from LevelUP:

function putForm(level, digest, form, callback) {
  var value = JSON.stringify({ version: VERSION, form: form })
  var put = level.put.bind(level, formKey(digest), value)
  thrice(put, callback) }

function getForm(level, digest, callback) {
  var key = formKey(digest)
  var get = level.get.bind(level, key)
  thrice(get, callback, isNotFoundError) }

// LevelUp `get` calls yield an error with `.notFound` set when a key
// doesn't exist in the store. This isn't an error per se, since the
// call succeeded. This predicate is used with calls to `thrice`.
function isNotFoundError(error) {
  return ( error && error.notFound ) }
