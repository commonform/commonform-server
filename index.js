module.exports = handler

var EventEmitter = require('eventemitter2').EventEmitter2
var concat = require('concat-stream')
var encode = require('bytewise/encoding/hex').encode
var isDigest = require('is-sha-256-hex-digest')
var normalize = require('commonform-normalize')
var parse = require('json-parse-errback')
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
  eventBus.onAny(function(event) {
    eventLog.info({ event: 'emit', name: event }) })

  return function(request, response) {
    request.log = bole(uuid.v4())
    request.log.info(request)
    var method = request.method
    var parsed = url.parse(request.url)
    var pathname = parsed.pathname
    if (pathname === '/') {
      if (method === 'GET') {
        response.setHeader('content-type', 'application/json')
        response.end(METADATA) }
      else {
        response.statusCode = 405
        response.end() } }
    if (pathname === '/forms') {
      if (method === 'POST') {
        request.pipe(concat(function(buffer) {
          parse(buffer, function(error, form) {
            if (error) {
              request.log.info({ event: 'invalid JSON' })
              response.statusCode = 400
              response.end('invalid JSON') }
            else {
              if (!validForm(form)) {
                request.log.info({ event: 'invalid form' })
                response.statusCode = 400
                response.end('invalid form') }
              else {
                var root = normalize(form).root
                request.log.info({ digest: root })
                var key = encode([ 'forms', root ])
                request.log({ key: key })
                var value = JSON.stringify({ version: VERSION, form: form })
                level.put(key, value, function(error) {
                  /* istanbul ignore if */
                  if (error) {
                    request.log.error(error)
                    response.statusCode = 500
                    response.end('database error') }
                  else {
                    request.log.info({ event: 'form' })
                    response.statusCode = 201
                    response.setHeader('location', ( '/forms/' + root ))
                    response.end()
                    eventBus.emit('form', form) } }) } } }) })) }
      else {
        response.statusCode = 405
        response.end() } }
    else if (pathname.startsWith('/forms/')) {
      var digest = pathname.substring('/forms/'.length)
      if (!isDigest(digest)) {
        request.log.info({ event: 'invalid digest' })
        response.statusCode = 404
        response.end() }
      else {
        var key = encode([ 'forms', digest ])
        level.get(key, function(error, value) {
          /* istanbul ignore if */
          if (error) {
            if (error.notFound) {
              request.log.info({ event: 'not found' })
              response.statusCode = 404
              response.end() }
            else {
              request.log.error(error)
              response.statusCode = 500
              response.end('database error') } }
          else {
            var form = JSON.parse(value).form
            response.setHeader('content-type', 'application/json')
            response.end(JSON.stringify(form)) } }) } }
    else {
      response.statusCode = 404
      response.end() } } }
