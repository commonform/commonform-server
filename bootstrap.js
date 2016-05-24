#!/usr/bin/env node
var url = process.argv[2]

if (!url) {
  process.stderr.write('Usage: <URL>\n')
  process.exit(1) }

var server = require('url').parse(url)

if (!process.env.hasOwnProperty('ADMINISTRATOR_PASSWORD')) {
  process.stderr.write('Set ADMINISTRATOR_PASSWORD')
  process.exit(1) }

var password = process.env.ADMINISTRATOR_PASSWORD

var each = require('async-each')
var http = require('http')
var log = require('pino')()
var s3 = require('./s3')

log.info({ event: 'starting' })

if (!s3) {
  log.error({ event: 'error', message: 'no s3'})
  process.exit(1) }

var formsLog = log.child({ type: 'forms' })
eachObject('forms/', formsLog, postForm, false, function() {
  formsLog.info({ event: 'done' })
  var projectsLog = log.child({ type: 'projects' })
  eachObject('projects/', projectsLog, postProject, false, function() {
    projectsLog.info({ event: 'done' })
    log.info({ event: 'done' }) }) })

function eachObject(prefix, log, iterator, marker, callback) {
  var query = { Prefix: prefix }
  if (marker) { query.Marker = marker }
  log.info({ event: 'querying' })
  s3.listObjects(query, function(error, data) {
    if (error) { log.error({ event: 'query error' }, error) }
    else {
      var keys = data.Contents
        .map(function(element) { return element.Key })
        .filter(function(key) { return !key.endsWith('/') })
      each(
        keys,
        function(key, done) {
          var keyLog = log.child({ key: key })
          keyLog.info({ event: 'get', key: key })
          s3.getObject({ Key: key }, function(error, data) {
            if (error) {
              keyLog.error({ event: 'get error' }, error)
              done() }
            else { iterator(JSON.parse(data.Body), keyLog, done) } }) },
        function() {
          if (data.IsTruncated) {
            var lastKey = keys[keys.length - 1]
            eachObject(prefix, log, iterator, lastKey) }
          else { callback() } }) } }) }

function postForm(record, log, callback) {
  var request =
    { protocol: server.protocol,
      host: server.hostname,
      method: 'POST',
      path: '/forms',
      port: server.port }
  log.info({ event: 'posting' })
  http
    .request(request, function(response) {
      var status = response.statusCode
      if (status === 201) { log.info({ event: 'wrote' }) }
      else { log.error({ event: 'write error', status: status }) }
      callback() })
    .end(JSON.stringify(record.form)) }

function postProject(record, log, callback) {
  var request =
    { protocol: server.protocol,
      host: server.hostname,
      method: 'POST',
      auth: ( 'administrator:' + password ),
      path:
        ( '/publishers/' + record.publisher +
          '/projects/' + record.project +
          '/editions/' + record.edition ),
      port: server.port }
  log.info({ event: 'posting' })
  http
    .request(request, function(response) {
      var status = response.statusCode
      if (status === 201) { log.info({ event: 'wrote' }) }
      else { log.error({ event: 'write error', status: status }) }
      callback() })
    .end(JSON.stringify({ digest: record.digest })) }
