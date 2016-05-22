module.exports = serverMetadata

var sendJSON = require('./send-json')
var methodNotAllowed = require('./method-not-allowed')

var METADATA = (function() {
  var meta = require('../package.json')
  return JSON.stringify({ service: meta.name, version: meta.version }) })()

function serverMetadata(request, response) {
  if (request.method === 'GET') { sendJSON(response, METADATA) }
  else { methodNotAllowed(response) } }
