module.exports = handler

var EventEmitter = require('eventemitter2').EventEmitter2
var concat = require('concat-stream')
var encode = require('bytewise/encoding/hex').encode
var isDigest = require('is-sha-256-hex-digest')
var normalize = require('commonform-normalize')
var parse = require('json-parse-errback')
var retry = require('retry')
var url = require('url')
var uuid = require('uuid')
var validForm = require('commonform-validate').form

var VERSION = require('./package.json').version
var METADATA = JSON.stringify(
  { service: require('./package.json').name,
    version: VERSION })

function handler(bole, level) {
  var eventLog = bole('events')
  var eventBus = new EventEmitter
  var emit = eventBus.emit.bind(eventBus)
  eventBus
    .onAny(function(event) {
      eventLog.info({ event: 'emit', name: event }) })
    .on('form', function(form, root, normalized) {
      form.content.forEach(function(element, index) {
        if (element.hasOwnProperty('form')) {
          var child = element.form
          var childRoot = normalized[root].content[index].digest
          putForm(level, child, childRoot, function(error) {
            /* istanbul ignore if */
            if (error) { eventLog.error(error) }
            else {
              setImmediate(function recurse() {
                emit('form', child, childRoot, normalized) }) } }) } }) })

  return function(request, response) {
    response.log = bole(uuid.v4())
    response.log.info(request)
    var method = request.method
    var parsed = url.parse(request.url)
    var pathname = parsed.pathname
    if (pathname === '/') {
      if (method === 'GET') { sendJSON(response, METADATA) }
      else { methodNotAllowed(response) } }
    if (pathname === '/forms') {
      if (method === 'POST') {
        request.pipe(concat(function(buffer) {
          parse(buffer, function(error, form) {
            if (error) { badRequest(response, 'invalid JSON') }
            else {
              if (!validForm(form)) { badRequest(response, 'invalid form') }
              else {
                var normalized = normalize(form)
                var root = normalized.root
                response.log.info({ digest: root })
                putForm(level, form, root, function(error) {
                  /* istanbul ignore if */
                  if (error) { internalDBError(response, error) }
                  else {
                    response.log.info({ event: 'form' })
                    response.statusCode = 201
                    response.setHeader('location', ( '/forms/' + root ))
                    response.end()
                    emit('form', form, root, normalized) } }) } } }) })) }
      else { methodNotAllowed(response) } }
    else if (pathname.startsWith('/forms/')) {
      var digest = pathname.substring('/forms/'.length)
      if (!isDigest(digest)) { badRequest(response, 'invalid digest') }
      else {
        if (method === 'GET') {
          getForm(level, digest, function(error, value) {
            /* istanbul ignore if */
            if (error) {
              if (error.notFound) { notFound(response) }
              else { internalDBError(response, error) } }
            else { sendJSON(response, JSON.parse(value).form) } }) }
        else { methodNotAllowed(response) } } }
    else { notFound(response) } } }

function badRequest(response, message) {
  response.log.info({ event: message })
  response.statusCode = 400
  response.end(message) }

/* istanbul ignore next */
function internalDBError(response, error) {
  response.log.error(error)
  response.statusCode = 500
  response.end('database error') }

function notFound(response) {
  response.statusCode = 404
  response.end() }

function methodNotAllowed(response) {
  response.statusCode = 405
  response.end() }

function putForm(level, form, digest, callback) {
  var value = JSON.stringify({ version: VERSION, form: form })
  var put = level.put.bind(level, formKey(digest), value)
  thrice(put, callback) }

function getForm(level, digest, callback) {
  var key = formKey(digest)
  var get = level.get.bind(level, key)
  thrice(get, callback, isNotFoundError) }

function isNotFoundError(error) {
  return ( error && error.notFound ) }

function formKey(digest) {
  return encode([ 'forms', digest ]) }

function sendJSON(response, body) {
  response.setHeader('content-type', 'application/json')
  response.end(( typeof body === 'string' ) ? body : JSON.stringify(body)) }

function thrice(asyncFunction, callback, /* optional */ isFinalError) {
  var operation = retry.operation({ retries: 3 })
  operation.attempt(function() {
    asyncFunction(function(error, result) {
      var haveFinalError = (
        ( typeof isFinalError === 'function' && isFinalError(error) ) ||
        !shouldRetry(error) )
      /* istanbul ignore else */
      if (haveFinalError) { callback(error, result) } }) })
  function shouldRetry(error) {
    operation.retry(error) } }