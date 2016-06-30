var http = require('http')
var server = require('./server')
var tape = require('tape')

tape('GET /nothing_here', function (test) {
  server(function (port, done) {
    var request = {path: '/noting_here', port: port}
    http.get(request, function (response) {
      test.equal(response.statusCode, 404, 'responds 404')
      done()
      test.end()
    })
  })
})
