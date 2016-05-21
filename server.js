var bole = require('bole')
var handler = require('./')
var http = require('http')
var fs = require('fs')
var leveldown = require('leveldown')
var levelup = require('levelup')
var meta = require('./package.json')
var path = require('path')
var uuid = require('uuid')

var description = ( meta.name + '@' + meta.version + '#' + uuid.v4() )
var log = bole(description)
bole.output({ level: 'debug', stream: process.stdout })

var directory = path.resolve(
  process.cwd(),
  ( process.env.LEVELDB || ( meta.name + '.leveldb' ) ))
fs.stat(directory, function(error, stat) {
  var existingData = ( !error && stat.isDirectory() )
  levelup(directory, { db: leveldown }, function(error, level) {
    if (error) {
      log.error({ event: 'level' }, error)
      process.exit(1) }
    else {
      log.info({ event: 'level', directory: directory })
      var server = http.createServer(handler(log, level))
      if (module.parent) {
        module.exports = server }
      else {
        var trap = function() {
          log.info({ event: 'signal' })
          level.close(function() {
            log.info({ event: 'closed level' })
            server.close(function() {
              log.info({ event: 'closed server' })
              process.exit(0) }) }) }
        process.on('SIGTERM', trap)
        process.on('SIGQUIT', trap)
        process.on('SIGINT', trap)
        var port = ( process.env.PORT || 0 )
        server.listen(port, function() {
          var boundPort = this.address().port
          log.info({ event: 'listening', port: boundPort })
          if (existingData) {
            require('./bootstrap')(level, log, port) } }) } } }) })
