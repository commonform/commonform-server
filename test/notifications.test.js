var postProject = require('./post-project')
var normalize = require('commonform-normalize')
var postAnnotation = require('./post-annotation')
var postForm = require('./post-form')
var nock = require('nock')
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
    nock('https://api.mailgun.net')
      .filteringRequestBody(function() { return '*' })
      .post('/v3/example.com/messages', '*')
      .reply(400)
      .on('replied', function(request) {
        test.notEqual(
          request.path.indexOf('example.com'), -1,
          'via example.com')
          done() ; test.end() })
    series(
      [ postForm(port, form, test),
        postProject('ana', 'ana\'s password', port, 'nda', '1e', digest, test),
        postAnnotation('bob', 'bob\'s password', port, annotation, test) ],
      function() { done() }) }) })
