module.exports = startTestServer

var decode = require('bytewise/encoding/hex').decode
var devnull = require('dev-null')
var format = require('util').format
var handler = require('../')
var http = require('http')
var levelup = require('levelup')
var memdown = require('memdown')
var pino = require('pino')
var publisherKeyFor = require('../keys/publisher')

var PUBLSIHERS = require('./publishers.json')

function startTestServer(callback, port) {
  port = ( port || 0 )
  var logStream = ( ( port === 0 ) ? devnull() : process.stdout )
  var log = pino({ name: 'test' }, logStream)
  var level = levelup('', { db: memdown })
  if (process.env.LOG_PUTS) {
    level.on('put', function(key, value) {
      var printable = (
        value === undefined
          ? 'undefined'
          : JSON.parse(value))
      process.stdout.write(
        format('put %j = %j', decode(key), printable)) }) }
  var batch = PUBLSIHERS.map(function(publisher) {
    return (
      { type: 'put',
        key: publisherKeyFor(publisher.name),
        value: JSON.stringify({ password: publisher.password }) } ) })
  level.batch(batch, function(error) {
    if (error) {
      process.stderr.write('Error writing test publishers')
      process.exit(1) }
    else {
      http.createServer(handler(log, level))
        .listen(port, function() {
          callback(
            this.address().port,
            this.close.bind(this)) }) } }) }
