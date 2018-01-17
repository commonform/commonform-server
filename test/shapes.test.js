var concat = require('./concat')
var hash = require('commonform-hash')
var http = require('http')
var indexNames = require('commonform-index-names')
var normalize = require('commonform-normalize')
var postForm = require('./post-form')
var postProject = require('./post-project')
var series = require('./series')
var server = require('./server')
var tape = require('tape')

var PUBLISHER = 'ana'
var PASSWORD = 'ana\'s password'

tape('GET /shapes/:digest/forms', function (test) {
  var form = {content: [{use: 'X'}]}
  var digest = normalize(form).root
  var shape = hash(indexNames(form))
  server(function (port, closeServer) {
    series(
      [
        postForm(port, PUBLISHER, PASSWORD, form, test),
        postProject(
          PUBLISHER, PASSWORD, port,
          'shaped', '1e',
          digest, false, false,
          test
        ),
        function (done) {
          var options = {
            method: 'GET',
            port: port,
            path: '/shapes/' + shape + '/forms'
          }
          http.request(options, function (response) {
            concat(test, response, function (body) {
              test.assert(Array.isArray(body), 'serves a JSON array')
              test.deepEqual(
                body, [{digest: digest}],
                'serves publication digest'
              )
              done()
            })
          })
            .end()
        }
      ],
      function () {
        closeServer()
        test.end()
      }
    )
  })
})
