// EventEmitter2 supports wildcard event handlers and `.onAny()`, which
// is used for logging.
var notFound = require('./routes/responses/not-found')
var url = require('url')
var uuid = require('uuid')

var TIMEOUT = parseInt(process.env.TIMEOUT) || 5000

module.exports = function (version, log, level, logServer) {
  var eventBus = require('./events')(log, level)
  var emit = eventBus.emit.bind(eventBus)
  var routes = require('./routes')
  return function requestHandler (request, response) {
    // Create a Pino child log for this HTTP response, marked with a
    // random UUID.
    response.log = log.child({log: uuid.v4()})
    response.log.info(request)
    response.on('finish', function () {
      response.log.info(response)
    })

    response.setTimeout(TIMEOUT, function () {
      response.log.error({event: 'timeout'})
      response.statusCode = 408
      response.removeAllListeners()
      response.end()
    })

    // Route the request.
    var parsed = url.parse(request.url)
    var route = routes.get(parsed.pathname)
    if (route.handler) {
      route.handler(request, response, route.params, log, level, emit)
    } else notFound(response)
  }
}
