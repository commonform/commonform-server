var doNotCache = require('do-not-cache')
var methodNotAllowed = require('./responses/method-not-allowed')
var sendJSON = require('./responses/send-json')

module.exports = function (request, response) {
  if (request.method === 'GET') {
    doNotCache(response)
    sendJSON(response, {
      service: 'commonform-server',
      version: request.configuration.version
    })
  } else {
    methodNotAllowed(response)
  }
}
