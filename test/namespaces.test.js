var http = require('http')
var normalize = require('commonform-normalize')
var series = require('async-series')
var server = require('./server')
var tape = require('tape')

tape('GET /digests', function(test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var form = { content: [ 'Blah blah blah.' ] }
  var digest = normalize(form).root
  server(function(port, closeServer) {
    series(
      [ function postForm(done) {
          http.request({ method: 'POST', port: port, path: '/forms' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST form 201')
              done() })
            .end(JSON.stringify(form)) },
        function postProject(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path: '/publishers/ana/projects/parent/editions/1e' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST project 201')
              done() })
            .end(JSON.stringify({ digest: digest })) },
        function getHeadings(done) {
          http.request(
            { method: 'GET', port: port, path: '/digests' },
            function(response) {
              var buffer = [ ]
              response
                .on('data', function(chunk) { buffer.push(chunk) })
                .on('end', function() {
                  var body = JSON.parse(Buffer.concat(buffer))
                  test.assert(Array.isArray(body), 'serves a JSON array')
                  test.assert(body.includes(digest), 'serves digest')
                  done() }) })
            .end() } ],
      function finish() {
        closeServer()
        test.end() }) }) })

tape('GET /headings', function(test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var heading = 'X'
  var form = { content: [ { reference: heading } ] }
  var digest = normalize(form).root
  server(function(port, closeServer) {
    series(
      [ function postForm(done) {
          http.request({ method: 'POST', port: port, path: '/forms' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST form 201')
              done() })
            .end(JSON.stringify(form)) },
        function postProject(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path: '/publishers/ana/projects/parent/editions/1e' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST project 201')
              done() })
            .end(JSON.stringify({ digest: digest })) },
        function getHeadings(done) {
          http.request(
            { method: 'GET', port: port, path: '/headings' },
            function(response) {
              var buffer = [ ]
              response
                .on('data', function(chunk) { buffer.push(chunk) })
                .on('end', function() {
                  var body = JSON.parse(Buffer.concat(buffer))
                  test.assert(Array.isArray(body), 'serves a JSON array')
                  test.assert(body.includes(heading), 'serves referenced heading')
                  done() }) })
            .end() } ],
      function finish() {
        closeServer()
        test.end() }) }) })

tape('GET /headings', function(test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var heading = 'X'
  var child = { content: [ 'Some content' ] }
  var childDigest = normalize(child).root
  var parent = { content: [ { heading: heading, form: child } ] }
  var parentDigest = normalize(parent).root
  server(function(port, closeServer) {
    series(
      [ function postForm(done) {
          http.request({ method: 'POST', port: port, path: '/forms' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST form 201')
              done() })
            .end(JSON.stringify(parent)) },
        function postProject(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path: '/publishers/ana/projects/parent/editions/1e' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST project 201')
              done() })
            .end(JSON.stringify({ digest: parentDigest })) },
        function getParents(done) {
          http.request(
            { method: 'GET',
              port: port,
              path: '/headings' },
            function(response) {
              var buffer = [ ]
              response
                .on('data', function(chunk) { buffer.push(chunk) })
                .on('end', function() {
                  var body = JSON.parse(Buffer.concat(buffer))
                  test.assert(Array.isArray(body), 'serves a JSON array')
                  test.assert(
                    body.includes(heading),
                    'serves heading')
                  done() }) })
            .end() } ],
      function finish() {
        closeServer()
        test.end() }) }) })

tape('GET /terms', function(test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var term = 'Admission'
  var form = { content: [ { use: term } ] }
  var digest = normalize(form).root
  server(function(port, closeServer) {
    series(
      [ function postForm(done) {
          http.request({ method: 'POST', port: port, path: '/forms' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST form 201')
              done() })
            .end(JSON.stringify(form)) },
        function postProject(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path: '/publishers/ana/projects/parent/editions/1e' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST project 201')
              done() })
            .end(JSON.stringify({ digest: digest })) },
        function getHeadings(done) {
          http.request(
            { method: 'GET', port: port, path: '/terms' },
            function(response) {
              var buffer = [ ]
              response
                .on('data', function(chunk) { buffer.push(chunk) })
                .on('end', function() {
                  var body = JSON.parse(Buffer.concat(buffer))
                  test.assert(Array.isArray(body), 'serves a JSON array')
                  test.assert(body.includes(term), 'serves used term')
                  done() }) })
            .end() } ],
      function finish() {
        closeServer()
        test.end() }) }) })

tape('GET /terms', function(test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var term = 'Admission'
  var form = { content: [ { definition: term } ] }
  var digest = normalize(form).root
  server(function(port, closeServer) {
    series(
      [ function postForm(done) {
          http.request({ method: 'POST', port: port, path: '/forms' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST form 201')
              done() })
            .end(JSON.stringify(form)) },
        function postProject(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path: '/publishers/ana/projects/parent/editions/1e' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST project 201')
              done() })
            .end(JSON.stringify({ digest: digest })) },
        function getHeadings(done) {
          http.request(
            { method: 'GET', port: port, path: '/terms' },
            function(response) {
              var buffer = [ ]
              response
                .on('data', function(chunk) { buffer.push(chunk) })
                .on('end', function() {
                  var body = JSON.parse(Buffer.concat(buffer))
                  test.assert(Array.isArray(body), 'serves a JSON array')
                  test.assert(body.includes(term), 'serves defined term')
                  done() }) })
            .end() } ],
      function finish() {
        closeServer()
        test.end() }) }) })
