var concat = require('concat-stream')
var http = require('http')
var meta = require('../package.json')
var server = require('./server')
var tape = require('tape')

tape('GET /', function (test) {
  server(function (port, done) {
    var request = {path: '/', port: port}
    http.get(request, function (response) {
      test.equal(response.statusCode, 200, 'responds 200')
      test.equal(
        response.headers['cache-control'],
        'no-cache, no-store, must-revalidate'
      )
      test.equal(response.headers['pragma'], 'no-cache')
      test.equal(response.headers['expires'], '0')
      response.pipe(concat(function (buffer) {
        test.same(
          JSON.parse(buffer),
          {service: meta.name, version: meta.version},
          'serves JSON with service name and version'
        )
        done()
        test.end()
      }))
    })
  })
})

tape('POST /', function (test) {
  server(function (port, done) {
    var request = {path: '/', method: 'POST', port: port}
    http.get(request, function (response) {
      test.equal(response.statusCode, 405, 'responds 405')
      done()
      test.end()
    })
  })
})
