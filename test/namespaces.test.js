var concat = require('./concat')
var http = require('http')
var normalize = require('commonform-normalize')
var postForm = require('./post-form')
var postProject = require('./post-project')
var series = require('./series')
var server = require('./server')
var tape = require('tape')

var PUBLISHER = 'ana'
var PASSWORD = 'ana\'s password'

tape('GET /digests', function (test) {
  var form = {content: ['Blah blah blah.']}
  var digest = normalize(form).root
  server(function (port, closeServer) {
    series(
      [
        postForm(port, PUBLISHER, PASSWORD, form, test),
        postProject(
          PUBLISHER, PASSWORD, port, 'parent', '1e', digest, test
        ),
        function (done) {
          var options = {method: 'GET', port: port, path: '/digests'}
          http.request(options, function (response) {
            concat(test, response, function (body) {
              test.assert(Array.isArray(body), 'serves a JSON array')
              test.assert(body.indexOf(digest) !== -1, 'serves digest')
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

tape('POST /digests', function (test) {
  server(function (port, closeServer) {
    var options = {method: 'POST', port: port, path: '/digests'}
    http.request(options, function (response) {
      test.equal(response.statusCode, 405, 'POST 405')
      closeServer()
      test.end()
    })
    .end()
  })
})

tape('GET /headings', function (test) {
  var heading = 'X'
  var form = {content: [{reference: heading}]}
  var digest = normalize(form).root
  server(function (port, closeServer) {
    series(
      [
        postForm(port, PUBLISHER, PASSWORD, form, test),
        postProject(
          PUBLISHER, PASSWORD, port, 'parent', '1e', digest, test
        ),
        function (done) {
          var options = {method: 'GET', port: port, path: '/headings'}
          http.request(options, function (response) {
            concat(test, response, function (body) {
              test.assert(Array.isArray(body), 'serves a JSON array')
              test.assert(
                body.indexOf(heading) !== -1,
                'serves referenced heading'
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

tape('GET /headings', function (test) {
  var heading = 'X'
  var child = {content: ['Some content']}
  var parent = {content: [{heading: heading, form: child}]}
  var parentDigest = normalize(parent).root
  server(function (port, closeServer) {
    series(
      [
        postForm(port, PUBLISHER, PASSWORD, parent, test),
        postProject(
          PUBLISHER, PASSWORD, port, 'parent', '1e', parentDigest, test
        ),
        function (done) {
          var options = {method: 'GET', port: port, path: '/headings'}
          http.request(options, function (response) {
            concat(test, response, function (body) {
              test.assert(Array.isArray(body), 'serves a JSON array')
              test.assert(
                body.indexOf(heading) !== -1,
                'serves heading'
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

tape('GET /terms', function (test) {
  var term = 'Admission'
  var form = {content: [{use: term}]}
  var digest = normalize(form).root
  server(function (port, closeServer) {
    series(
      [
        postForm(port, PUBLISHER, PASSWORD, form, test),
        postProject(
          PUBLISHER, PASSWORD, port, 'parent', '1e', digest, test
        ),
        function (done) {
          var options = {method: 'GET', port: port, path: '/terms'}
          http.request(options, function (response) {
            concat(test, response, function (body) {
              test.assert(Array.isArray(body), 'serves a JSON array')
              test.assert(body.indexOf(term) !== -1, 'serves used term')
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

tape('GET /terms', function (test) {
  var term = 'Admission'
  var form = {content: [{definition: term}]}
  var digest = normalize(form).root
  server(function (port, closeServer) {
    series(
      [
        postForm(port, PUBLISHER, PASSWORD, form, test),
        postProject(
          PUBLISHER, PASSWORD, port, 'parent', '1e', digest, test
        ),
        function (done) {
          var options = {method: 'GET', port: port, path: '/terms'}
          http.request(options, function (response) {
            concat(test, response, function (body) {
              test.assert(Array.isArray(body), 'serves a JSON array')
              test.assert(
                body.indexOf(term) !== -1,
                'serves defined term'
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

tape('GET /projects', function (test) {
  var project = 'superform'
  var form = {content: ['Super content']}
  var digest = normalize(form).root
  server(function (port, closeServer) {
    series(
      [
        postForm(port, PUBLISHER, PASSWORD, form, test),
        postProject(
          PUBLISHER, PASSWORD, port, project, '1e', digest, test
        ),
        function (done) {
          var options = {method: 'GET', port: port, path: '/projects'}
          http.request(options, function (response) {
            concat(test, response, function (body) {
              test.assert(Array.isArray(body), 'serves a JSON array')
              test.assert(
                body.indexOf(project) !== -1,
                'serves project name term'
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
