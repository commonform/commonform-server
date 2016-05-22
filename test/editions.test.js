var concat = require('concat-stream')
var http = require('http')
var normalize = require('commonform-normalize')
var series = require('async-series')
var server = require('./server')
var tape = require('tape')

tape('GET /publishers/$publisher/projects/$project/editions', function(test) {
  test.plan(4)
  var publisher = 'ana'
  var password = 'ana\'s password'
  var form = { content: [ 'A test form' ] }
  var digest = normalize(form).root
  server(function(port, done) {
    series(
      [ function putForm(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path: '/forms' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST form 201')
              done() })
            .end(JSON.stringify(form)) },
        function put1e(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path: '/publishers/ana/projects/nda/editions/1e' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST 1e 201')
              done() })
            .end(JSON.stringify({ digest: digest })) },
        function put1e1u(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path: '/publishers/ana/projects/nda/editions/1e1u' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST 1e1u 201')
              done() })
            .end(JSON.stringify({ digest: digest })) },
        function getEditions(done) {
          http.request(
            { method: 'GET',
              port: port,
              path: '/publishers/ana/projects/nda/editions' },
            function(response) {
              response.pipe(concat(function(buffer) {
                var responseBody = JSON.parse(buffer)
                test.deepEqual(
                  responseBody, [ '1e', '1e1u' ],
                  'GET editions JSON')
                done() })) })
            .end() } ],
      function finish() {
        done()
        test.end() }) }) })
