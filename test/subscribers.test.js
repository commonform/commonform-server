var http = require('http')
var mailgun = require('../mailgun')
var normalize = require('commonform-normalize')
var postAnnotation = require('./post-annotation')
var postForm = require('./post-form')
var postProject = require('./post-project')
var series = require('async-series')
var server = require('./server')
var tape = require('tape')

var publisher = 'ana'
var password = 'ana\'s password'
var email = 'ana@example.com'
var auth = ( publisher + ':' + password )
var form = { content: [ 'The child' ] }
var digest = normalize(form).root
var annotation =
  { publisher: publisher,
    form: digest, context: digest,
    replyTo: null, text: 'Not good' }
var project = 'nda'
var edition = '1e'
var formPath = ( '/forms/' + digest )
var publisherPath = ( '/publishers/' + publisher )
var projectPath = ( publisherPath + '/projects/' + project )
var editionPath = ( projectPath + '/editions/' + edition )

tape('POST /forms/:digest/subscribers', function(test) {
  server(function(port, done) {
    mailgun.events
      .once('message', function(message) {
        test.equal(message.to, email, 'to')
        mailgun.events.removeAllListeners()
        done() ; test.end() })
    series(
      [ postForm(port, form, test),
        function(done) {
          http.request(
            { method: 'POST',
              port: port,
              path: ( formPath + '/subscribers/' + publisher ),
              auth: ( publisher + ':' + password ) })
            .on('response', function(response) {
              test.equal(response.statusCode, 204)
              done() })
            .end() },
        postAnnotation(publisher, password, port, annotation, test) ],
      function() { /* pass */ }) }) })

tape('DELETE /forms/:digest/subscribers', function(test) {
  server(function(port, closeServer) {
    mailgun.events
      .once('message', function() { test.fail('sent notification') })
    series(
      [ postForm(port, form, test),
        function(done) {
          http.request(
            { method: 'POST',
              port: port,
              path: ( formPath + '/subscribers/' + publisher ),
              auth: ( publisher + ':' + password ) })
            .on('response', function(response) {
              test.equal(response.statusCode, 204, '204')
              done() })
            .end() },
        function(done) {
          http.request(
            { method: 'DELETE',
              port: port,
              path: ( formPath + '/subscribers/' + publisher ),
              auth: ( publisher + ':' + password ) })
            .on('response', function(response) {
              test.equal(response.statusCode, 204)
              done() })
            .end() },
        postAnnotation(publisher, password, port, annotation, test) ],
      function() {
        setTimeout(
          function() {
            mailgun.events.removeAllListeners()
            test.end() ; closeServer() },
          500) }) }) })

tape('POST /publishers/:/projects/:/editions/:/subscribers', function(test) {
  server(function(port, closeServer) {
    mailgun.events
      .once('message', function(message) {
        test.equal(message.to, email, 'to')
        mailgun.events.removeAllListeners()
        closeServer() ; test.end() })
    series(
      [ postForm(port, form, test),
        postProject(publisher, password, port, project, edition, digest, test),
        function(done) {
          http.request(
            { method: 'POST',
              port: port,
              path: ( editionPath + '/subscribers/' + publisher ),
              auth: auth })
            .on('response', function(response) {
              test.equal(response.statusCode, 204, '204')
              done() })
            .end() },
        postAnnotation(publisher, password, port, annotation, test) ],
      function() { /* pass */ }) }) })

tape('DELETE /publishers/:/projects/:/editions/:/subscribers', function(test) {
  server(function(port, closeServer) {
    mailgun.events
      .once('message', function() { test.fail('sent notification') })
    var subscriptionPath = ( editionPath + '/subscribers/' + publisher )
    series(
      [ postForm(port, form, test),
        postProject(publisher, password, port, project, edition, digest, test),
        function(done) {
          http.request(
            { method: 'POST', port: port, path: subscriptionPath, auth: auth })
            .on('response', function(response) {
              test.equal(response.statusCode, 204, '204')
              done() })
            .end() },
        function(done) {
          http.request(
            { method: 'DELETE', port: port, path: subscriptionPath, auth: auth })
            .on('response', function(response) {
              test.equal(response.statusCode, 204, '204')
              done() })
            .end() },
        postAnnotation(publisher, password, port, annotation, test) ],
      function() {
        setTimeout(
          function() {
            mailgun.events.removeAllListeners()
            test.end() ; closeServer() },
          500) }) }) })

tape('POST /publishers/:/projects/:/subscribers/:', function(test) {
  var subscriptionPath = ( projectPath + '/subscribers/' + publisher )
  server(function(port, closeServer) {
    mailgun.events
      .once('message', function(message) {
        test.equal(message.to, email, 'to')
        mailgun.events.removeAllListeners()
        closeServer() ; test.end() })
    series(
      [ postForm(port, form, test),
        postProject(publisher, password, port, project, edition, digest, test),
        function(done) {
          http.request(
            { method: 'POST',
              port: port,
              path: subscriptionPath,
              auth: auth })
            .on('response', function(response) {
              test.equal(response.statusCode, 204, '204')
              done() })
            .end() },
        postProject(publisher, password, port, project, '2e', digest, test) ],
      function() { /* pass */ }) }) })

tape('DELETE /publishers/:/projects/:/subscribers/:', function(test) {
  server(function(port, closeServer) {
    mailgun.events
      .once('message', function() { test.fail('sent notification') })
    var subscriptionPath = ( projectPath + '/subscribers/' + publisher )
    series(
      [ postForm(port, form, test),
        postProject(publisher, password, port, project, edition, digest, test),
        function(done) {
          http.request(
            { method: 'POST', port: port, path: subscriptionPath, auth: auth })
            .on('response', function(response) {
              test.equal(response.statusCode, 204, '204')
              done() })
            .end() },
        function(done) {
          http.request(
            { method: 'DELETE', port: port, path: subscriptionPath, auth: auth })
            .on('response', function(response) {
              test.equal(response.statusCode, 204, '204')
              done() })
            .end() },
        postProject(publisher, password, port, project, '2e', digest, test) ],
      function() {
        setTimeout(
          function() {
            mailgun.events.removeAllListeners()
            test.end() ; closeServer() },
          500) }) }) })

tape('POST /publishers/:/subscribers/:', function(test) {
  var subscriptionPath = ( publisherPath + '/subscribers/' + publisher )
  server(function(port, closeServer) {
    mailgun.events
      .once('message', function(message) {
        test.equal(message.to, email, 'to')
        mailgun.events.removeAllListeners()
        closeServer() ; test.end() })
    series(
      [ postForm(port, form, test),
        function(done) {
          http.request(
            { method: 'POST',
              port: port,
              path: subscriptionPath,
              auth: auth })
            .on('response', function(response) {
              test.equal(response.statusCode, 204, '204')
              done() })
            .end() },
        postProject(publisher, password, port, project, edition, digest, test) ],
      function() { /* pass */ }) }) })

tape('DELETE /publishers/:/subscribers/:', function(test) {
  var subscriptionPath = ( publisherPath + '/subscribers/' + publisher )
  server(function(port, closeServer) {
    mailgun.events
      .once('message', function() { test.fail('sent notification') })
    series(
      [ postForm(port, form, test),
        function(done) {
          http.request(
            { method: 'POST', port: port, path: subscriptionPath, auth: auth })
            .on('response', function(response) {
              test.equal(response.statusCode, 204, '204')
              done() })
            .end() },
        function(done) {
          http.request(
            { method: 'DELETE', port: port, path: subscriptionPath, auth: auth })
            .on('response', function(response) {
              test.equal(response.statusCode, 204, '204')
              done() })
            .end() },
        postProject(publisher, password, port, project, edition, digest, test) ],
      function() {
        setTimeout(
          function() {
            mailgun.events.removeAllListeners()
            test.end() ; closeServer() },
          500) }) }) })
