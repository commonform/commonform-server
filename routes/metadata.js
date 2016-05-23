module.exports = serverMetadata

var doNotCache = require('do-not-cache')
var methodNotAllowed = require('./responses/method-not-allowed')
var sendJSON = require('./responses/send-json')

var METADATA = (function() {
  var meta = require('../package.json')
  return JSON.stringify({ service: meta.name, version: meta.version }) })()

function serverMetadata(request, response) {
  if (request.method === 'GET') {
    doNotCache(response)
    sendJSON(response, METADATA) }
  else { methodNotAllowed(response) } }
