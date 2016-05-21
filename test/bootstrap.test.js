var http = require('http')
var mktempd = require('temporary-directory')
var name = require('../package.json').name
var path = require('path')
var spawn = require('child_process').spawn
var tape = require('tape')
var node = process.argv[0]

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
    waitOn(firstServer, function() {
      var form = { content: [ 'Test form!' ] }
      var post = { method: 'POST', path: '/forms', port: PORT }
      http
        .request(post, function(response) {
          test.equal(
            response.statusCode, 201,
            'first server responds 201')
          var location = response.headers.location
          firstServer.kill()
          waitOn(firstServer, function() {
            var secondServer = spawnServer()
            waitOn(secondServer, function() {
              var get = { path: location, port: PORT }
              http
                .request(get, function(response) {
                  test.same(
                    response.statusCode, 200,
                    'second server responds 200')
                  var buffers = [ ]
                  response
                    .on('data', function(buffer) {
                      buffers.push(buffer) })
                    .on('end', function() {
                      var responseBody = JSON.parse(Buffer.concat(buffers))
                      test.same(
                        form, responseBody,
                        'second server serves the form')
                      secondServer.kill()
                      test.end() }) })
                .end() }) }) })
        .end(JSON.stringify(form)) }) }) })

function waitOn(process, f) {
  var buffers = [ ]
  var listener = function(buffer) {
    buffers.push(buffer)
    var string = Buffer.concat(buffers).toString()
    var trigger = (
      string.includes('"listening"') ||
      string.includes('"closed server"') )
    if (trigger) {
      f()
      process.stdout.removeListener('data', listener) } }
  process.stdout.addListener('data', listener) }
