var entryToLevelUPBatch = require('./transforms')
var migrateVersionedLog = require('migrate-versioned-log')
var notFound = require('./routes/responses/not-found')
var pump = require('pump')
var through2 = require('through2')
var url = require('url')
var uuid = require('uuid')

var TIMEOUT = parseInt(process.env.TIMEOUT) || 5000
var migrations = require('./migrations')

module.exports = function (version, serverLog, level, dataLog) {
  var pipelineLog = serverLog.child({log: 'pipeline'})
  pump(
    dataLog.readStream,
    through2.obj(function pullOutVersion (chunk, _, done) {
      var entry = chunk.entry
      var version = entry.version
      delete entry.version
      pipelineLog.info({
        index: chunk.index,
        version: version,
        type: entry.type
      }, 'read')
      done(null, {
        index: chunk.index,
        version: version,
        entry: entry
      })
    }),
    migrateVersionedLog(migrations),
    through2.obj(function (chunk, _, done) {
      entryToLevelUPBatch(
        chunk.entry, level,
        function (error, operations) {
          /* istanbul ignore if */
          if (error) {
            pipelineLog.fatal(error)
            done(error)
          } else {
            operations.forEach(function (operation) {
              if (operation.type === undefined) {
                operation.type = 'put'
              }
              if (operation.value === undefined) {
                operation.value = ''
              }
            })
            level.batch(operations, done)
          }
        }
      )
    })
  )

  var write = function (entry, callback) {
    entry.version = version
    dataLog.write(entry, function (error, index) {
      /* istanbul ignore if */
      if (error) {
        callback(error)
      } else {
        serverLog.info({event: 'logged', index: index, entry: entry})
        callback()
      }
    })
  }

  var routes = require('./routes')
  return function requestHandler (request, response) {
    // Create a Pino child log for this HTTP response, marked with a
    // random UUID.
    response.log = serverLog.child({log: uuid.v4()})
    response.log.info(request)
    response.on('finish', function () {
      response.log.info(response)
    })

    response.setTimeout(
      TIMEOUT,
      /* istanbul ignore next */
      function () {
        response.log.error({event: 'timeout'})
        response.statusCode = 408
        response.removeAllListeners()
        response.end()
      }
    )

    // Route the request.
    var parsed = url.parse(request.url, true)
    request.query = parsed.query
    var route = routes.get(parsed.pathname)
    if (route.handler) {
      route.handler(
        request,
        response,
        route.params,
        serverLog,
        level,
        write
      )
    } else {
      notFound(response)
    }
  }
}
