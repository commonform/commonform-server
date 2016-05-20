var bole = require('bole')
var handler = require('./')
var http = require('http')
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
levelup(directory, { db: leveldown }, function(error, level) {
  if (error) {
    log.error({ event: 'level', error: error })
    process.exit(1) }
  else {
    log.info({ event: 'level', directory: directory })
    var server = http.createServer(handler(log, level))
    if (module.parent) {
      module.exports = server }
    else {
      var port = ( process.env.PORT || 0 )
      server.listen(port, function() {
        log.info(
          { event: 'listening',
            port: this.address().port }) }) } } })
