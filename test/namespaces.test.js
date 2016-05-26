var concat = require('./concat')
var http = require('http')
var normalize = require('commonform-normalize')
var postForm = require('./post-form')
var postProject = require('./post-project')
var series = require('async-series')
var server = require('./server')
var tape = require('tape')

var PUBLISHER = 'ana'
var PASSWORD = 'ana\'s password'

tape('GET /digests', function(test) {
  var form = { content: [ 'Blah blah blah.' ] }
  var digest = normalize(form).root
  server(function(port, closeServer) {
    series(
      [ postForm(port, form, test),
        postProject(PUBLISHER, PASSWORD, port, 'parent', '1e', digest, test),
        function(done) {
          http.get(
            { method: 'GET', port: port, path: '/digests' },
            function(response) {
              concat(test, response, function(body) {
                test.assert(Array.isArray(body), 'serves a JSON array')
                test.assert(body.includes(digest), 'serves digest')
                done() }) }) } ],
      function() { closeServer() ; test.end() }) }) })

tape('GET /headings', function(test) {
  var heading = 'X'
  var form = { content: [ { reference: heading } ] }
  var digest = normalize(form).root
  server(function(port, closeServer) {
    series(
      [ postForm(port, form, test),
        postProject(PUBLISHER, PASSWORD, port, 'parent', '1e', digest, test),
        function(done) {
          http.get(
            { method: 'GET', port: port, path: '/headings' },
            function(response) {
              concat(test, response, function(body) {
                test.assert(Array.isArray(body), 'serves a JSON array')
                test.assert(body.includes(heading), 'serves referenced heading')
                done() }) }) } ],
      function() { closeServer() ; test.end() }) }) })

tape('GET /headings', function(test) {
  var heading = 'X'
  var child = { content: [ 'Some content' ] }
  var parent = { content: [ { heading: heading, form: child } ] }
  var parentDigest = normalize(parent).root
  server(function(port, closeServer) {
    series(
      [ postForm(port, parent, test),
        postProject(PUBLISHER, PASSWORD, port, 'parent', '1e', parentDigest, test),
        function(done) {
          http.get(
            { method: 'GET', port: port, path: '/headings' },
            function(response) {
              concat(test, response, function(body) {
                test.assert(Array.isArray(body), 'serves a JSON array')
                test.assert(
                  body.includes(heading),
                  'serves heading')
                done() }) }) } ],
      function() { closeServer() ; test.end() }) }) })

tape('GET /terms', function(test) {
  var term = 'Admission'
  var form = { content: [ { use: term } ] }
  var digest = normalize(form).root
  server(function(port, closeServer) {
    series(
      [ postForm(port, form, test),
        postProject(PUBLISHER, PASSWORD, port, 'parent', '1e', digest, test),
        function(done) {
          http.get(
            { method: 'GET', port: port, path: '/terms' },
            function(response) {
              concat(test, response, function(body) {
                test.assert(Array.isArray(body), 'serves a JSON array')
                test.assert(body.includes(term), 'serves used term')
                done() }) }) } ],
      function() { closeServer() ; test.end() }) }) })

tape('GET /terms', function(test) {
  var term = 'Admission'
  var form = { content: [ { definition: term } ] }
  var digest = normalize(form).root
  server(function(port, closeServer) {
    series(
      [ postForm(port, form, test),
        postProject(PUBLISHER, PASSWORD, port, 'parent', '1e', digest, test),
        function(done) {
          http.get(
            { method: 'GET', port: port, path: '/terms' },
            function(response) {
              concat(test, response, function(body) {
                test.assert(Array.isArray(body), 'serves a JSON array')
                test.assert(body.includes(term), 'serves defined term')
                done() }) }) } ],
      function() { closeServer() ; test.end() }) }) })
