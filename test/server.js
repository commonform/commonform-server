process.env.ADMINISTRATOR_PASSWORD = 'test'

var AbstractBlobStore = require('abstract-blob-store')
var EventEmitter = require('events').EventEmitter
var SimpleLog = require('level-simple-log')
var TCPLogClient = require('tcp-log-client')
var devNull = require('dev-null')
var encode = require('encoding-down')
var http = require('http')
var levelup = require('levelup')
var makeRequestHandler = require('../')
var memdown = require('memdown')
var net = require('net')
var pino = require('pino')
var sha256 = require('sha256')
var tcpLogServer = require('tcp-log-server')

var VERSION = require('../package.json').version
var PUBLISHERS = require('./publishers.json')

module.exports = setupServers

function setupServers (callback) {
  // Start a tcp-log-server.
  setupLogServer(function (logServer) {
    var port = logServer.address().port
    // Start an HTTP server connected to the log server.
    setupHTTPServer(port, function (httpServer) {
      // Provide the server objects to the test.
      callback(httpServer.address().port, function () {
        httpServer.close()
        logServer.close()
      })
    })
  })
}

function setupHTTPServer (logServerPort, ready) {
  // Use an in-memory LevelUP storage back-end.
  var level = levelup(encode(memdown(), { valueEncoding: 'json' }))
  //  Pipe log messages to nowhere.
  var log = pino({}, devNull())
  var server
  // Create a client for the tcp-log-server.
  var logClient = new TCPLogClient({ server: { port: logServerPort } })
  // Start the HTTP server when the log client catches up with the log.
    .once('current', function () {
      server.listen(0, function () {
        ready(this)
      })
    })
  var configuration = {
    version: VERSION
  }
  // Created the HTTP server.
  var handler = makeRequestHandler(configuration, log, level, logClient)
  server = http.createServer(handler)
    .once('close', function () {
      level.close()
      logClient.destroy()
    })
  // Connect the log client.
  logClient.connect()
  // Create test publishers.
  logClient.on('ready', function () {
    PUBLISHERS.forEach(function (publisher) {
      logClient.write({
        version: '0.0.0',
        type: 'publisher',
        data: publisher
      }, noop)
    })
  })
}

function noop () { }

function setupLogServer (ready) {
  // Use an in-memory LevelUP storage back-end.
  var level = levelup(encode(memdown(), { valueEncoding: 'json' }))
  var logs = new SimpleLog(level)
  // Use an in-memory blob store.
  var blobs = new AbstractBlobStore()
  // Pipe log messages to nowhere.
  var log = pino({}, devNull())
  var emitter = new EventEmitter()
  var handler = tcpLogServer(log, logs, blobs, emitter, sha256)
  // Starts the TCP server.
  net.createServer(handler)
    .once('close', function () {
      level.close()
    })
    .listen(0, function () {
      ready(this)
    })
}
