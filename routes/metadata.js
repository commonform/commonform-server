module.exports = serverMetadata

var sendJSON = require('./responses/send-json')
var methodNotAllowed = require('./responses/method-not-allowed')

var METADATA = (function() {
  var meta = require('../package.json')
  return JSON.stringify({ service: meta.name, version: meta.version }) })()

function serverMetadata(request, response) {
  if (request.method === 'GET') { sendJSON(response, METADATA) }
  else { methodNotAllowed(response) } }
