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

tape('POST /publishers without credentials', function(test) {
  test.plan(1)
  var body = { name: 'bob', password: 'evil mastdon hoary cup' }
  server(function(port, done) {
    http.request({ method: 'POST', port: port, path: '/publishers' })
      .on('response', function(response) {
          test.equal(response.statusCode, 401, 'POST 401')
          done() })
      .end(JSON.stringify(body)) }) })

tape('POST /publishers with bad credentials', function(test) {
  test.plan(1)
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
          done() })
      .end(JSON.stringify(body)) }) })

tape('POST /publishers with credentials', function(test) {
  test.plan(2)
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
          done() })
      .end(JSON.stringify(body)) }) })

tape('POST /publishers with insecure password', function(test) {
  test.plan(2)
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
          done() })
      .end(JSON.stringify(body)) }) })

tape('POST /publishers for administrator', function(test) {
  test.plan(2)
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
          done() })
      .end(JSON.stringify(body)) }) })
