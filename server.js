#!/usr/bin/env node
var TCPLogClient = require('tcp-log-client')
var http = require('http')
var leveldown = require('leveldown')
var levelup = require('levelup')
var makeHandler = require('./')
var memdown = require('memdown')
var meta = require('./package.json')
var pino = require('pino')
var uuid = require('uuid')

var VERSION = meta.version
var NAME = meta.name

var DESCRIPTION = NAME + '@' + VERSION + '#' + uuid.v4()
var serverLog = pino({name: DESCRIPTION})

var env = process.env

var LEVEL_PATH
var LEVEL_OPTIONS = {
  valueEncoding: 'json'
}

if (env.LEVELDB && env.LEVELDB.toLowerCase() === 'memory') {
  LEVEL_OPTIONS.db = memdown
  LEVEL_PATH = 'memdown'
} else {
  LEVEL_OPTIONS.db = leveldown
  LEVEL_PATH = env.LEVELDB || NAME + '.leveldb'
}

levelup(LEVEL_PATH, LEVEL_OPTIONS, function (error, level) {
  if (error) {
    serverLog.fatal({event: 'level'}, error)
    process.exit(1)
  } else {
    serverLog.info({event: 'level', directory: LEVEL_PATH})
    var LOG_HOST = env.LOG_HOST || 'localhost'
    var LOG_PORT = env.LOG_PORT ? parseInt(env.LOG_PORT) : 4444
    var tcpLogLog = serverLog.child({log: 'tcp-log'})
    var logClient = new TCPLogClient({
      server: {
        host: LOG_HOST,
        port: LOG_PORT
      }
    })
    var handler = makeHandler(VERSION, serverLog, level, logClient)
    var server = http.createServer(handler)
    if (module.parent) {
      module.exports = server
    } else {
      var cleanup = function () {
        level.close(function () {
          serverLog.info({event: 'closed level'})
          server.close(function () {
            serverLog.info({event: 'closed server'})
            process.exit(0)
          })
        })
      }
      var trap = function () {
        serverLog.info({event: 'signal'})
        cleanup()
      }
      process.on('SIGTERM', trap)
      process.on('SIGQUIT', trap)
      process.on('SIGINT', trap)
      process.on('uncaughtException', function (exception) {
        serverLog.error({exception: exception})
        cleanup()
      })
      var port = process.env.PORT || 8080
      server.listen(port, function () {
        var boundPort = this.address().port
        serverLog.info({event: 'listening', port: boundPort})
      })
    }
    logClient
      .on('error', function (error) {
        tcpLogLog.error(error)
      })
      .on('fail', function () {
        tcpLogLog.error({event: 'fail'})
        server.close()
      })
    logLogEvent('connect')
    logLogEvent('disconnect')
    logLogEvent('reconnect')
    logLogEvent('backoff')
    logLogEvent('ready')
    logLogEvent('current')
    logClient.connect()
  }
  function logLogEvent (event) {
    logClient.on(event, function () {
      tcpLogLog.info({event: event})
    })
  }
})
