var http = require('http')
var mktempd = require('temporary-directory')
var name = require('../package.json').name
var path = require('path')
var spawn = require('child_process').spawn
var tape = require('tape')
var node = process.execPath

tape('Bootstrap From Existing LevelDB Data', function(test) {
  var server = path.join(process.cwd(), 'server.js')
  var PORT = 9999
  mktempd(name, function(error, directory, cleanup) {
    tape.onFinish(cleanup)
    test.ifError(error, 'no error creating temp dir')
    var leveldb = path.join(directory, 'leveldb')
    var options =
      { env: { PORT: PORT, LEVELDB: leveldb },
        cwd: directory }
    function spawnServer() {
      var process = spawn(node, [ server ], options)
      return process }
    var firstServer = spawnServer()
    waitOn(firstServer, 'listening', function() {
      var form = { content: [ 'Test form!' ] }
      var post = { method: 'POST', path: '/forms', port: PORT }
      http
        .request(post, function(response) {
          test.equal(
            response.statusCode, 201,
            'first server responds 201')
          var location = response.headers.location
          firstServer.kill()
          waitOn(firstServer, 'closed server', function() {
            var secondServer = spawnServer()
            waitOn(secondServer, 'bootstrapped', function() {
              var get = { path: location, port: PORT }
              http
                .request(get, function(response) {
                  test.same(
                    response.statusCode, 200,
                    'second server responds 200')
                  var buffer = [ ]
                  response
                    .on('data', function(chunk) {
                      buffer.push(chunk) })
                    .on('end', function() {
                      var responseBody = JSON.parse(Buffer.concat(buffer))
                      test.same(
                        form, responseBody,
                        'second server serves the form')
                      secondServer.kill()
                      test.end() }) })
                .end() }) }) })
        .end(JSON.stringify(form)) }) }) })

function waitOn(child, event, callback) {
  var buffer = [ ]
  var listener = function(chunk) {
    buffer.push(chunk)
    var string = Buffer.concat(buffer).toString()
    if (string.includes('"event":"' + event + '"')) {
      callback()
      child.stdout.removeListener('data', listener) } }
  child.stdout.addListener('data', listener) }
