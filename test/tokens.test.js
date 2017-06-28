var concat = require('./concat')
var http = require('http')
var server = require('./server')
var tape = require('tape')
var jwt = require('jwt-decode')

tape('GET /token', function (test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  server(function (port, done) {
    http.request({
      path: '/token',
      port: port,
      auth: publisher + ':' + password
    })
      .once('response', function (response) {
        test.equal(
          response.statusCode, 200,
          'responds 200'
        )
        var buffer = []
        response
          .on('data', function (chunk) {
            buffer.push(chunk)
          })
          .once('end', function () {
            var body = Buffer.concat(buffer)
            var decoded = jwt(body.toString())
            test.equal(
              decoded.publisher, publisher,
              'issues token for publisher'
            )
            done()
            test.end()
          })
      })
      .end()
  })
})
