#!/usr/bin/env node
var url = process.argv[2]

if (!url) {
  process.stderr.write('Usage: <URL>\n')
  process.exit(1) }

var server = require('url').parse(url)
var http = (
  server.protocol === 'https:'
    ? require('https')
    : require('http') )

if (!process.env.hasOwnProperty('ADMINISTRATOR_PASSWORD')) {
  process.stderr.write('Set ADMINISTRATOR_PASSWORD')
  process.exit(1) }

var password = process.env.ADMINISTRATOR_PASSWORD

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
    var annotationsLog = log.child({ type: 'annotations' })
    eachObject('annotations/', annotationsLog, postAnnotation, false, function() {
      log.info({ event: 'done' }) }) }) })

var CONCURRENCY = 10

function eachObject(prefix, log, iterator, marker, callback) {
  var doneListing = false
  var objectQueue = require('async.queue')(
    function worker(key, doneWithObject) {
      var keyLog = log.child({ key: key })
      keyLog.info({ event: 'get', key: key })
      s3.getObject({ Key: key }, function(error, data) {
        if (error) {
          keyLog.error({ event: 'get error' }, error)
          finished() }
        else { iterator(JSON.parse(data.Body), keyLog, finished) } })
      function finished() {
        doneWithObject()
        callBackIfDone() } },
    CONCURRENCY)
  iterateObjects()
  function callBackIfDone() {
    if (doneListing && objectQueue.idle()) { callback() } }
  function iterateObjects(fromKey) {
    var query = { Prefix: prefix }
    if (fromKey) { query.Marker = fromKey }
    s3.listObjects(query, function(error, data) {
      if (error) { log.error({ event: 'query error' }, error) }
      else {
        var keys = data.Contents
          .map(function(element) { return element.Key })
          .filter(function(key) { return !key.endsWith('/') })
        // Push keys to the object queue for processing.
        keys.forEach(function(key) { objectQueue.push(key) })
        // Fetch additional keys if this response did not list all.
        if (data.IsTruncated) {
          // Recurse using the last-fetched key as the marker for the
          // next list query.
          var lastKey = keys[keys.length - 1]
          iterateObjects(lastKey) }
        // Set flag so the queue knows when it can call back when it is
        // done processing all queued keys.
        else { doneListing = true } } }) } }

function postForm(record, log, callback) {
  var request =
    { host: server.hostname,
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
  var publication = record.publication
  var path = (
    '/' +
    [ 'publishers',
      publication.publisher,
      'projects',
      publication.project,
      'publications',
      publication.edition ]
      .map(encodeURIComponent)
      .join('/') )
  var request =
    { protocol: server.protocol,
      host: server.hostname,
      method: 'POST',
      auth: ( 'administrator:' + password ),
      path: path,
      port: server.port }
  log.info({ event: 'posting' })
  http
    .request(request, function(response) {
      var status = response.statusCode
      if (status === 201) { log.info({ event: 'wrote' }) }
      else { log.error({ event: 'write error', status: status }) }
      callback() })
    .end(JSON.stringify({ digest: publication.digest })) }

function postAnnotation(record, log, callback) {
  var request =
    { protocol: server.protocol,
      host: server.hostname,
      method: 'POST',
      auth: ( 'administrator:' + password ),
      path: '/annotations',
      port: server.port }
  log.info({ event: 'posting' })
  http
    .request(request, function(response) {
      var status = response.statusCode
      if (status === 201) { log.info({ event: 'wrote' }) }
      else { log.error({ event: 'write error', status: status }) }
      callback() })
    .end(JSON.stringify({ digest: record.digest })) }
