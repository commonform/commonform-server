module.exports = startTestServer

var bole = require('bole')
var handler = require('../')
var http = require('http')
var levelup = require('levelup')
var memdown = require('memdown')

function startTestServer(callback, port) {
  port = ( port || 0 )
  var log = bole('test')
  var level = levelup('', { db: memdown })
  if (port !== 0) {
    bole.output({ level: 'debug', stream: process.stdout }) }
  http.createServer(handler(log, level))
    .listen(port, function() {
      callback(
        this.address().port,
        this.close.bind(this)) }) }
