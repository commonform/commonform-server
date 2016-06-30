#!/usr/bin/env node
var handler = require('./')
var http = require('http')
var leveldown = require('leveldown')
var levelup = require('levelup')
var meta = require('./package.json')
var path = require('path')
var pino = require('pino')
var uuid = require('uuid')

var description = meta.name + '@' + meta.version + '#' + uuid.v4()
var log = pino({name: description})

var directory = path.resolve(
  process.cwd(),
  process.env.LEVELDB || meta.name + '.leveldb'
)
levelup(directory, {db: leveldown}, function (error, level) {
  if (error) {
    log.fatal({event: 'level'}, error)
    process.exit(1)
  } else {
    log.info({event: 'level', directory: directory})
    var server = http.createServer(handler(log, level))
    if (module.parent) module.exports = server
    else {
      var cleanup = function () {
        level.close(function () {
          log.info({event: 'closed level'})
          server.close(function () {
            log.info({event: 'closed server'})
            process.exit(0)
          })
        })
      }
      var trap = function () {
        log.info({event: 'signal'})
        cleanup()
      }
      process.on('SIGTERM', trap)
      process.on('SIGQUIT', trap)
      process.on('SIGINT', trap)
      process.on('uncaughtException', function (exception) {
        log.error({exception: exception})
        cleanup()
      })
      var port = process.env.PORT || 0
      server.listen(port, function () {
        var boundPort = this.address().port
        log.info({event: 'listening', port: boundPort})
      })
    }
  }
})
