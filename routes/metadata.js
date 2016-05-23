module.exports = serverMetadata

var sendJSON = require('./responses/send-json')
var methodNotAllowed = require('./responses/method-not-allowed')

var METADATA = (function() {
  var meta = require('../package.json')
  return JSON.stringify({ service: meta.name, version: meta.version }) })()

function serverMetadata(request, response) {
  if (request.method === 'GET') {
    response.setHeader('cache-control', 'no-cache, no-store, must-revalidate')
    response.setHeader('pragma', 'no-cache')
    response.setHeader('expires', '0')
    sendJSON(response, METADATA) }
  else { methodNotAllowed(response) } }
