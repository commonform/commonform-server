var concat = require('./concat')
var http = require('http')
var normalize = require('commonform-normalize')
var series = require('async-series')
var server = require('./server')
var tape = require('tape')
var postForm = require('./post-form')
var postProject = require('./post-project')

tape('GET /publishers/$publisher/projects/$project/editions', function(test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var form = { content: [ 'A test form' ] }
  var digest = normalize(form).root
  server(function(port, closeServer) {
    series(
      [ postForm(port, form, test),
        postProject(publisher, password, port, 'nda', '1e', digest, test),
        postProject(publisher, password, port, 'nda', '1e1u', digest, test),
        function(done) {
          http.get(
            { method: 'GET',
              port: port,
              path: '/publishers/ana/projects/nda/editions' },
            function(response) {
              concat(test, response, function(body) {
                test.deepEqual(
                  body, [ '1e', '1e1u' ],
                  'GET editions JSON')
                done() }) }) } ],
      function() { closeServer() ; test.end() }) }) })
