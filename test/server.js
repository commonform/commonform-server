module.exports = startTestServer

var bole = require('bole')
var decode = require('bytewise/encoding/hex').decode
var format = require('util').format
var handler = require('../')
var http = require('http')
var levelup = require('levelup')
var memdown = require('memdown')
var publisherKeyFor = require('../keys/publisher')

var PUBLSIHERS = require('./publishers.json')

function startTestServer(callback, port) {
  port = ( port || 0 )
  var log = bole('test')
  var level = levelup('', { db: memdown })
  if (process.env.LOG_PUTS) {
    level.on('put', function(key, value) {
      var printable = (
        value === undefined
          ? 'undefined'
          : JSON.parse(value))
      process.stdout.write(
        format('put %j = %j', decode(key), printable)) }) }
  if (port !== 0) {
    bole.output({ level: 'debug', stream: process.stdout }) }
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
