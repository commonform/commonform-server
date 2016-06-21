var http = require('http')
var mailgun = require('../mailgun')
var normalize = require('commonform-normalize')
var postAnnotation = require('./post-annotation')
var postForm = require('./post-form')
var postProject = require('./post-project')
var series = require('async-series')
var server = require('./server')
var subscribeToAnnotation = require('./subscribe-to-annotation')
var subscribeToEdition = require('./subscribe-to-publication')
var subscribeToForm = require('./subscribe-to-form')
var subscribeToProject = require('./subscribe-to-project')
var subscribeToPublisher = require('./subscribe-to-publisher')
var tape = require('tape')
var unsubscribeFromAnnotation = require('./unsubscribe-from-annotation')
var unsubscribeFromEdition = require('./unsubscribe-from-publication')
var unsubscribeFromForm = require('./unsubscribe-from-form')
var unsubscribeFromProject = require('./unsubscribe-from-project')
var unsubscribeFromPublisher = require('./unsubscribe-from-publisher')

var publisher = 'ana'
var password = 'ana\'s password'
var email = 'ana@example.com'
var form = { content: [ 'The child' ] }
var digest = normalize(form).root
var annotation =
  { publisher: publisher,
    form: digest, context: digest,
    replyTo: [ ], text: 'Not good' }
var project = 'nda'
var edition = '1e'

tape('POST /forms/:digest/subscribers > annotation notification', function(test) {
  server(function(port, done) {
    mailgun.events
      .once('message', function(message) {
        test.equal(message.to, email, 'to')
        mailgun.events.removeAllListeners()
        done() ; test.end() })
    series(
      [ postForm(publisher, password, port, form, test),
        subscribeToForm(port, publisher, password, test, digest),
        postAnnotation(publisher, password, port, annotation, test) ],
      function() { /* pass */ }) }) })

tape('POST /forms/:digest/subscribers > published notification', function(test) {
  server(function(port, done) {
    mailgun.events
      .once('message', function(message) {
        test.equal(message.to, email, 'to')
        mailgun.events.removeAllListeners()
        done() ; test.end() })
    series(
      [ postForm(publisher, password, port, form, test),
        subscribeToForm(port, publisher, password, test, digest),
        postProject(publisher, password, port, project, edition, digest, test) ],
      function() { /* pass */ }) }) })

tape('DELETE /forms/:digest/subscribers', function(test) {
  server(function(port, closeServer) {
    mailgun.events
      .once('message', function() { test.fail('sent notification') })
    series(
      [ postForm(publisher, password, port, form, test),
        subscribeToForm(port, publisher, password, test, digest),
        unsubscribeFromForm(port, publisher, password, test, digest),
        postAnnotation(publisher, password, port, annotation, test) ],
      function() {
        setTimeout(
          function() {
            mailgun.events.removeAllListeners()
            test.end() ; closeServer() },
          500) }) }) })

tape('GET /forms/:digest/subscribers/:', function(test) {
  var subscriptionPath = ( '/forms/' + digest + '/subscribers/' + publisher )
  server(function(port, closeServer) {
    series(
      [ postForm(publisher, password, port, form, test),
        subscribeToForm(port, publisher, password, test, digest),
        function(done) {
          http.get(
            { port: port,
              path: subscriptionPath,
              auth: ( publisher + ':' + password ) },
            function(response) {
              test.equal(response.statusCode, 204, '204 as subscriber')
              done() }) },
        function(done) {
          http.get(
            { port: port,
              path: subscriptionPath,
              auth: ( 'bob:bob\'s password' ) },
            function(response) {
              test.equal(response.statusCode, 403, '403 as other publisher')
              done() }) } ],
      function() { closeServer() ; test.end() }) }) })

tape('GET /forms/:digest/subscribers/:not-subscribed', function(test) {
  var subscriptionPath = ( '/forms/' + digest + '/subscribers/' + publisher )
  server(function(port, closeServer) {
    series(
      [ postForm(publisher, password, port, form, test),
        function(done) {
          http.get(
            { port: port,
              path: subscriptionPath,
              auth: ( publisher + ':' + password ) },
            function(response) {
              test.equal(response.statusCode, 404, '404 as subscriber')
              done() }) },
        function(done) {
          http.get(
            { port: port,
              path: subscriptionPath,
              auth: ( 'bob:bob\'s password' ) },
            function(response) {
              test.equal(response.statusCode, 403, '403 as other publisher')
              done() }) } ],
      function() { closeServer() ; test.end() }) }) })

tape('PATCH /forms/:digest/subscribers/:', function(test) {
  var subscriptionPath = ( '/forms/' + digest + '/subscribers/' + publisher )
  server(function(port, closeServer) {
    series(
      [ postForm(publisher, password, port, form, test),
        subscribeToForm(port, publisher, password, test, digest),
        function(done) {
          http.request(
            { method: 'PATCH',
              port: port,
              path: subscriptionPath,
              auth: ( publisher + ':' + password ) })
            .on('response', function(response) {
              test.equal(response.statusCode, 405, '405')
              done() })
            .end() } ],
      function() { closeServer() ; test.end() }) }) })

tape('POST /publishers/:/projects/:/publications/:/subscribers', function(test) {
  server(function(port, closeServer) {
    mailgun.events
      .once('message', function(message) {
        test.equal(message.to, email, 'to')
        mailgun.events.removeAllListeners()
        closeServer() ; test.end() })
    series(
      [ postForm(publisher, password, port, form, test),
        postProject(publisher, password, port, project, edition, digest, test),
        subscribeToEdition(port, publisher, password, test, publisher, project, edition),
        postAnnotation(publisher, password, port, annotation, test) ],
      function() { /* pass */ }) }) })

tape('DELETE /publishers/:/projects/:/publications/:/subscribers', function(test) {
  server(function(port, closeServer) {
    mailgun.events
      .once('message', function() { test.fail('sent notification') })
    series(
      [ postForm(publisher, password, port, form, test),
        postProject(publisher, password, port, project, edition, digest, test),
        subscribeToEdition(port, publisher, password, test, publisher, project, edition),
        unsubscribeFromEdition(port, publisher, password, test, publisher, project, edition),
        postAnnotation(publisher, password, port, annotation, test) ],
      function() {
        setTimeout(
          function() {
            mailgun.events.removeAllListeners()
            test.end() ; closeServer() },
          500) }) }) })

tape('POST /publishers/:/projects/:/subscribers/:', function(test) {
  server(function(port, closeServer) {
    mailgun.events
      .once('message', function(message) {
        test.equal(message.to, email, 'to')
        mailgun.events.removeAllListeners()
        closeServer() ; test.end() })
    series(
      [ postForm(publisher, password, port, form, test),
        postProject(publisher, password, port, project, edition, digest, test),
        subscribeToProject(port, publisher, password, test, publisher, project),
        postProject(publisher, password, port, project, '2e', digest, test) ],
      function() { /* pass */ }) }) })

tape('DELETE /publishers/:/projects/:/subscribers/:', function(test) {
  server(function(port, closeServer) {
    mailgun.events
      .once('message', function() { test.fail('sent notification') })
    series(
      [ postForm(publisher, password, port, form, test),
        postProject(publisher, password, port, project, edition, digest, test),
        subscribeToProject(port, publisher, password, test, publisher, project),
        unsubscribeFromProject(port, publisher, password, test, publisher, project),
        postProject(publisher, password, port, project, '2e', digest, test) ],
      function() {
        setTimeout(
          function() {
            mailgun.events.removeAllListeners()
            test.end() ; closeServer() },
          500) }) }) })

tape('POST /publishers/:/subscribers/:', function(test) {
  server(function(port, closeServer) {
    mailgun.events
      .once('message', function(message) {
        test.equal(message.to, email, 'to')
        mailgun.events.removeAllListeners()
        closeServer() ; test.end() })
    series(
      [ postForm(publisher, password, port, form, test),
        subscribeToPublisher(port, publisher, password, test, publisher),
        postProject(publisher, password, port, project, edition, digest, test) ],
      function() { /* pass */ }) }) })

tape('DELETE /publishers/:/subscribers/:', function(test) {
  server(function(port, closeServer) {
    mailgun.events
      .once('message', function() { test.fail('sent notification') })
    series(
      [ postForm(publisher, password, port, form, test),
        subscribeToPublisher(port, publisher, password, test, publisher),
        unsubscribeFromPublisher(port, publisher, password, test, publisher),
        postProject(publisher, password, port, project, edition, digest, test) ],
      function() {
        setTimeout(
          function() {
            mailgun.events.removeAllListeners()
            test.end() ; closeServer() },
          500) }) }) })

tape('POST /annotations/:/subscribers/:', function(test) {
  var uuid
  var reply = JSON.parse(JSON.stringify(annotation))
  server(function(port, closeServer) {
    mailgun.events
      .once('message', function(message) {
        test.equal(message.to, email, 'to')
        mailgun.events.removeAllListeners()
        closeServer() ; test.end() })
    series(
      [ postForm(publisher, password, port, form, test),
        function annotate(done) {
          postAnnotation(publisher, password, port, annotation, test)(withLocation)
          function withLocation(error, location) {
            uuid = location.replace('/annotations/', '')
            reply.replyTo = [ uuid ]
            done() } },
        subscribeToAnnotation(port, publisher, password, test, function() {
          return uuid }),
        function postReply(done) {
          var reply = JSON.parse(JSON.stringify(annotation))
          reply.replyTo = [ uuid ]
          postAnnotation(publisher, password, port, reply, test)(done) } ],
      function() { /* pass */ }) }) })

tape('DELETE /annotation/:/subscribers/:', function(test) {
  var uuid
  var reply = JSON.parse(JSON.stringify(annotation))
  server(function(port, closeServer) {
    mailgun.events
      .once('message', function() { test.fail('sent notification') })
    series(
      [ postForm(publisher, password, port, form, test),
        function annotate(done) {
          postAnnotation(publisher, password, port, annotation, test)(withLocation)
          function withLocation(error, location) {
            uuid = location.replace('/annotations/', '')
            reply.replyTo = [ uuid ]
            done() } },
        subscribeToAnnotation(port, publisher, password, test, function() {
          return uuid }),
        unsubscribeFromAnnotation(port, publisher, password, test, function() {
          return uuid }),
        function postReply(done) {
          postAnnotation(publisher, password, port, reply, test)(done) } ],
      function() {
        setTimeout(
          function() {
            mailgun.events.removeAllListeners()
            test.end() ; closeServer() },
          500) }) }) })
