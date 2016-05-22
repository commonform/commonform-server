var concat = require('concat-stream')
var http = require('http')
var normalize = require('commonform-normalize')
var series = require('async-series')
var server = require('./server')
var tape = require('tape')

tape('GET /publishers/$publisher/projects/$project/editions/$existing', function(test) {
  test.plan(4)
  var form = { content: [ 'A test form' ] }
  var digest = normalize(form).root
  server(function(port, done) {
    series(
      [ function putForm(done) {
          http.request(
            { auth: ( 'ana:ana\'s password' ),
              method: 'POST',
              port: port,
              path: '/forms' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST form 201')
              done() })
            .end(JSON.stringify(form)) },
        function putAnaProject(done) {
          http.request(
            { auth: ( 'ana:ana\'s password' ),
              method: 'POST',
              port: port,
              path: '/publishers/ana/projects/x/editions/1e' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST project 201')
              done() })
            .end(JSON.stringify({ digest: digest })) },
        function putBobProject(done) {
          http.request(
            { auth: ( 'bob:bob\'s password' ),
              method: 'POST',
              port: port,
              path: '/publishers/bob/projects/y/editions/1e' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST 201')
              done() })
            .end(JSON.stringify({ digest: digest })) },
        function getPublishers(done) {
          http.request(
            { method: 'GET', port: port, path: '/publishers' },
            function(response) {
              response.pipe(concat(function(buffer) {
                var responseBody = JSON.parse(buffer)
                test.deepEqual(
                  responseBody, [ 'ana', 'bob' ],
                  'GET publishers JSON')
                done() })) })
            .end() } ],
      function finish() {
        done()
        test.end() }) }) })
