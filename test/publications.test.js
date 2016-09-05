var concat = require('./concat')
var http = require('http')
var normalize = require('commonform-normalize')
var postForm = require('./post-form')
var postProject = require('./post-project')
var series = require('./series')
var server = require('./server')
var tape = require('tape')

tape(
  'GET /publishers/{publisher}/projects/{project}/publications',
  function (test) {
    var publisher = 'ana'
    var password = 'ana\'s password'
    var form = {content: ['A test form']}
    var digest = normalize(form).root
    server(function (port, closeServer) {
      series(
        [
          postForm(port, publisher, password, form, test),
          postProject(
            publisher, password, port,
            'nda', '1e',
            digest, false, false,
            test
          ),
          postProject(
            publisher, password, port,
            'nda', '1e1u',
            digest, false, false,
            test
          ),
          function (done) {
            var options = {
              method: 'GET',
              port: port,
              path: '/publishers/ana/projects/nda/publications'
            }
            http.request(options, function (response) {
              concat(test, response, function (body) {
                test.deepEqual(
                  body, ['1e', '1e1u'],
                  'GET publications JSON'
                )
                done()
              })
            })
            .end()
          }
        ],
        function finish () {
          closeServer()
          test.end()
        }
      )
    })
  }
)

tape(
  'PUT /publishers/{publisher}/projects/{project}/publications',
  function (test) {
    server(function (port, done) {
      var options = {
        method: 'PUT',
        port: port,
        path: '/publishers/ana/projects/nda/publications'
      }
      http.request(options, function (response) {
        test.equal(response.statusCode, 405, 'responds 405')
        done()
        test.end()
      })
      .end()
    })
  }
)
