#!/usr/bin/env node
var handler = require('./')
var http = require('http')
var leveldown = require('leveldown')
var levelup = require('levelup')
var meta = require('./package.json')
var path = require('path')
var pino = require('pino')
var uuid = require('uuid')

var version = meta.version
var description = meta.name + '@' + version + '#' + uuid.v4()
var log = pino({name: description})

var argv = require('yargs')
.usage('Usage: commonform-server [options]')
.describe('log-host', 'tcp-log-server host')
.default('log-host', 'localhost')
.alias('log-host', 's')
.describe('log-port', 'tcp-log-server port')
.alias('log-port', 'p')
.default('level', meta.name + '.leveldb')
.alias('level', 'l')
.describe('level', 'LevelDB directory')
.demand(['log-port'])
.help()
.version(version)
.argv

var directory = path.resolve(process.cwd(), argv.level)
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
