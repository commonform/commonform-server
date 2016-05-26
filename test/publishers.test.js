var concat = require('./concat')
var http = require('http')
var normalize = require('commonform-normalize')
var postForm = require('./post-form')
var postProject = require('./post-project')
var series = require('async-series')
var server = require('./server')
var tape = require('tape')

tape('GET /publishers/$publisher/projects/$project/editions/$existing', function(test) {
  var form = { content: [ 'A test form' ] }
  var digest = normalize(form).root
  server(function(port, done) {
    series(
      [ postForm(port, form, test),
        postProject('ana', 'ana\'s password', port, 'x', '1e', digest, test),
        postProject('bob', 'bob\'s password', port, 'y', '1e', digest, test),
        function getPublishers(done) {
          http.get(
            { port: port, path: '/publishers' },
            function(response) {
              concat(test, response, function(body) {
                test.deepEqual(
                  body, [ 'ana', 'bob' ],
                  'GET publishers JSON')
                done() }) }) } ],
      function() { done() ; test.end() }) }) })

tape('POST /publishers without credentials', function(test) {
  var body = { name: 'bob', password: 'evil mastdon hoary cup' }
  server(function(port, done) {
    http.request({ method: 'POST', port: port, path: '/publishers' })
      .on('response', function(response) {
          test.equal(response.statusCode, 401, 'POST 401')
          done() ; test.end() })
      .end(JSON.stringify(body)) }) })

tape('POST /publishers with bad credentials', function(test) {
  var body = { name: 'bob', password: 'evil mastdon hoary cup' }
  var user = 'administrator'
  var password = 'incorrect password'
  server(function(port, done) {
    http.request(
      { auth: ( user + ':' + password ),
        method: 'POST',
        port: port,
        path: '/publishers' })
      .on('response', function(response) {
          test.equal(response.statusCode, 401, 'POST 401')
          done() ; test.end() })
      .end(JSON.stringify(body)) }) })

tape('POST /publishers with password', function(test) {
  var body = { name: 'bob', password: 'evil mastdon hoary cup' }
  var user = 'administrator'
  var password = process.env.ADMINISTRATOR_PASSWORD
  server(function(port, done) {
    http.request(
      { auth: ( user + ':' + password ),
        method: 'POST',
        port: port,
        path: '/publishers' })
      .on('response', function(response) {
          test.equal(response.statusCode, 201, 'POST 201')
          test.equal(
            response.headers.location, '/publishers/bob',
            'Location')
          done() ; test.end() })
      .end(JSON.stringify(body)) }) })

tape('POST /publishers with hashed password', function(test) {
  var body =
    { name: 'bob',
      hash: '$2a$10$IGrb1Nzx/EkeTN07QF7HGeS/yl2gWbKrG9Lx0zDgqI71gI2EO4Cdy' }
  var user = 'administrator'
  var password = process.env.ADMINISTRATOR_PASSWORD
  server(function(port, done) {
    http.request(
      { auth: ( user + ':' + password ),
        method: 'POST',
        port: port,
        path: '/publishers' })
      .on('response', function(response) {
          test.equal(response.statusCode, 201, 'POST 201')
          test.equal(
            response.headers.location, '/publishers/bob',
            'Location')
          done() ; test.end() })
      .end(JSON.stringify(body)) }) })

tape('POST /publishers with insecure password', function(test) {
  var body = { name: 'bob', password: 'password' }
  var user = 'administrator'
  var password = process.env.ADMINISTRATOR_PASSWORD
  server(function(port, done) {
    http.request(
      { auth: ( user + ':' + password ),
        method: 'POST',
        port: port,
        path: '/publishers' })
      .on('response', function(response) {
          test.equal(response.statusCode, 400, 'POST 400')
          var buffer = [ ]
          response
            .on('data', function(chunk) {
              buffer.push(chunk) })
            .on('end', function() {
              test.same(
                Buffer.concat(buffer).toString(),
                'invalid password',
                'serves "invalid password"') })
          done() ; test.end() })
      .end(JSON.stringify(body)) }) })

tape('POST /publishers for administrator', function(test) {
  var body = { name: 'administrator', password: 'evil mastdon hoary cup' }
  var user = 'administrator'
  var password = process.env.ADMINISTRATOR_PASSWORD
  server(function(port, done) {
    http.request(
      { auth: ( user + ':' + password ),
        method: 'POST',
        port: port,
        path: '/publishers' })
      .on('response', function(response) {
          test.equal(response.statusCode, 400, 'POST 400')
          var buffer = [ ]
          response
            .on('data', function(chunk) {
              buffer.push(chunk) })
            .on('end', function() {
              test.same(
                Buffer.concat(buffer).toString(),
                'invalid publisher name',
                'serves "invalid publisher name"') })
          done() ; test.end() })
      .end(JSON.stringify(body)) }) })
