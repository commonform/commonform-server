var postProject = require('./post-project')
var normalize = require('commonform-normalize')
var postAnnotation = require('./post-annotation')
var postForm = require('./post-form')
var series = require('async-series')
var server = require('./server')
var tape = require('tape')

tape('Notification on annotation to publication', function(test) {
  var form = { content: [ 'The child' ] }
  var digest = normalize(form).root
  var annotation =
    { publisher: 'bob',
      form: digest,
      context: digest,
      replyTo: null,
      text: 'Not good' }
  server(function(port, done) {
    var mailgun = require('../mailgun')
    mailgun.events
      .on('message', function(message) {
        test.equal(message.to, 'ana@example.com', 'to ana@example.com')
        test.equal(
          message.subject, 'Annotation to ana/nda@1e',
          'subject')
        test.notEqual(
          message.text.indexOf('bob'), -1,
          'text includes bob')
        test.notEqual(
          message.text.indexOf('ana/nda@1e'), -1,
          'text includes project')
        test.notEqual(
          message.text.indexOf('annotation'), -1,
          'text includes "annotation"')
        done() ; test.end() })
    series(
      [ postForm(port, form, test),
        postProject('ana', 'ana\'s password', port, 'nda', '1e', digest, test),
        postAnnotation('bob', 'bob\'s password', port, annotation, test) ],
      function() { done() }) }) })
