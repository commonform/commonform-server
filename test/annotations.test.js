var concat = require('./concat')
var http = require('http')
var normalize = require('commonform-normalize')
var postAnnotation = require('./post-annotation')
var postForm = require('./post-form')
var series = require('async-series')
var server = require('./server')
var tape = require('tape')

tape('POST /annotations', function(test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var child = { content: [ 'The child' ] }
  var childDigest = normalize(child).root
  var parent = { content: [ { form: child } ] }
  var parentDigest = normalize(parent).root
  var annotation = {
    publisher: publisher,
    form: childDigest,
    context: parentDigest,
    replyTo: null,
    private: false,
    text: 'Not good' }
  server(function(port, done) {
    series(
      [ postForm(port, parent, test),
        postAnnotation(publisher, password, port, annotation, test) ],
      function() { done() ; test.end() }) }) })

tape('GET /annotation/:uuid', function(test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var child = { content: [ 'The child' ] }
  var childDigest = normalize(child).root
  var parent = { content: [ { form: child } ] }
  var parentDigest = normalize(parent).root
  var annotation = {
    publisher: publisher,
    form: childDigest,
    context: parentDigest,
    replyTo: null,
    private: false,
    text: 'Not good' }
  var uuid
  server(function(port, done) {
    series(
      [ postForm(port, parent, test),
        function(done) {
          postAnnotation(publisher, password, port, annotation, test)(withLocation)
          function withLocation(error, location) {
            uuid = location.replace('/annotations/', '')
            done() } },
        function(done) {
          http.get(
            { port: port, path: ( '/annotations/' + uuid ) },
            function(response) {
              test.equal(response.statusCode, 200, 'GET 200')
              concat(test, response, function(body) {
                test.equal(body.text, annotation.text, 'serves text')
                done() }) }) } ],
      function() { done() ; test.end() }) }) })

tape('GET /forms/:digest/annotations', function(test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var child = { content: [ 'The child' ] }
  var childDigest = normalize(child).root
  var parent = { content: [ { form: child } ] }
  var parentDigest = normalize(parent).root
  var annotation = {
    publisher: publisher,
    form: childDigest,
    context: parentDigest,
    replyTo: null,
    private: false,
    text: 'Not good' }
  server(function(port, done) {
    series(
      [ postForm(port, parent, test),
        postAnnotation(publisher, password, port, annotation, test),
        function(done) {
          http.get(
            { port: port,
              path: ( '/forms/' + childDigest + '/annotations' ) },
            function(response) {
              test.equal(response.statusCode, 200, 'GET 200')
              concat(test, response, function(body) {
                test.equal(
                  body[0].text, annotation.text,
                  'serves annotation')
                done() }) }) } ],
      function() { done() ; test.end() }) }) })
