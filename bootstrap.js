#!/usr/bin/env node
var url = process.argv[2]

if (!url) {
  process.stderr.write('Usage: <URL>\n')
  process.exit(1) }

var server = require('url').parse(url)

var http = require('http')
var pino = require('pino')

var s3 = require('./s3')
var log = pino()

log.info({ event: 'starting' })

if (!s3) {
  log.error({ event: 'error', message: 'no s3'})
  process.exit(1) }

var formLog = log.child({ type: 'form' })

bootstrapForms()

function bootstrapForms(marker) {
  var query = { Prefix: 'forms/' }
  if (marker) { query.Marker = marker }
  formLog.info({ event: 'querying' })
  s3.listObjects(query, function(error, data) {
    if (error) {
      log.error({ event: 'query error' }, error) }
    else {
      var keys = data.Contents
        .map(function(element) { return element.Key })
        .filter(function(key) { return ( key !== 'forms/' ) })
      keys.forEach(function(key) {
        var keyLog = formLog.child({ key: key })
        keyLog.info({ event: 'get', key: key })
        s3.getObject({ Key: key }, function(error, data) {
          if (error) {
            keyLog.error({ event: 'get error' }, error) }
          else {
            postForm(JSON.parse(data.Body).form, keyLog) } }) })
      if (data.IsTruncated) {
        bootstrapForms(keys[keys.length - 1]) } } }) }

function postForm(form, log) {
  var request =
    { protocol: server.protocol,
      host: server.hostname,
      method: 'POST',
      path: '/forms',
      port: server.port }
  formLog.info({ event: 'posting' })
  http
    .request(request, function(response) {
      var status = response.statusCode
      if(status === 201) {
        log.info({ event: 'wrote' }) }
      else {
        log.error({ event: 'write error', status: status }) } })
    .end(JSON.stringify(form)) }
