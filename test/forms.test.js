var concat = require('concat-stream')
var http = require('http')
var normalize = require('commonform-normalize')
var server = require('./server')
var tape = require('tape')

tape('POST /forms with invalid JSON', function(test) {
  server(function(port, done) {
    var request = { method: 'POST', path: '/forms', port: port }
    http
      .request(request, function(response) {
        test.equal(response.statusCode, 400, 'responds 400')
        response.pipe(concat(function(buffer) {
          test.equal(
            buffer.toString(), 'invalid JSON',
            'responds "invalid JSON"')
          done() ; test.end() })) })
      .end('not valid json') }) })

tape('POST /forms with form', function(test) {
  server(function(port, done) {
    var form = { content: [ 'Just a test' ] }
    var root = normalize(form).root
    var request = { method: 'POST', path: '/forms', port: port }
    http
      .request(request, function(response) {
        test.equal(response.statusCode, 201, 'responds 200')
        test.equal(
          response.headers.location, ( '/forms/' + root ),
          'sets location header')
          done() ; test.end() })
      .end(JSON.stringify(form)) }) })

tape('POST /forms with form', function(test) {
  server(function(port, done) {
    var form = { invalid: 'form' }
    var request = { method: 'POST', path: '/forms', port: port }
    http
      .request(request, function(response) {
        test.equal(response.statusCode, 400, 'responds 400')
        response.pipe(concat(function(buffer) {
          test.equal(
            buffer.toString(), 'invalid form',
            'serves "invalid form"')
          done() ; test.end() })) })
      .end(JSON.stringify(form)) }) })

tape('GET /forms/$not_a_digest', function(test) {
  server(function(port, done) {
    var digest = 'blah'
    var request = { path: ( '/forms/' + digest ), port: port }
    http.get(request, function(response) {
      test.equal(response.statusCode, 400, 'responds 404')
      done() ; test.end() }) }) })

tape('GET /forms/$nonexistent', function(test) {
  server(function(port, done) {
    var digest = 'a'.repeat(64)
    var request = { path: ( '/forms/' + digest ), port: port }
    http.get(request, function(response) {
      test.equal(response.statusCode, 404, 'responds 404')
      done() ; test.end() }) }) })

tape('POST /forms/$digest', function(test) {
  server(function(port, done) {
    var digest = 'a'.repeat(64)
    var request =
      { method: 'POST',
        path: ( '/forms/' + digest ),
        port: port }
    http.get(request, function(response) {
      test.equal(response.statusCode, 405, 'responds 405')
      done() ; test.end() }) }) })

tape('GET /forms/$posted', function(test) {
  server(function(port, done) {
    var form = { content: [ 'Test form' ] }
    var root = normalize(form).root
    var post = { method: 'POST', path: '/forms', port: port }
    http
      .request(post, function(response) {
        test.equal(response.statusCode, 201, 'responds 201')
        var get = { path: ( '/forms/' + root ), port: port }
        http.get(get, function(response) {
          response.pipe(concat(function(buffer) {
            test.same(JSON.parse(buffer), form, 'serves the posted form')
            done() ; test.end() })) }) })
      .end(JSON.stringify(form)) }) })

tape('GET /forms/$child_of_posted', function(test) {
  server(function(port, done) {
    var child = { content: [ 'Child Form' ] }
    var parent = { content: [ { form: child } ] }
    var childDigest = normalize(child).root
    var post = { method: 'POST', path: '/forms', port: port }
    http
      .request(post, function(response) {
        test.equal(response.statusCode, 201, 'responds 201')
        var get = { path: ( '/forms/' + childDigest ), port: port }
        http.get(get, function(response) {
          response.pipe(concat(function(buffer) {
            test.same(JSON.parse(buffer), child, 'serves the posted form')
            done() ; test.end() })) }) })
      .end(JSON.stringify(parent)) }) })

tape('PUT /forms', function(test) {
  server(function(port, done) {
    var request = { method: 'PUT', path: '/forms', port: port }
    http
      .request(request, function(response) {
        test.equal(response.statusCode, 405, 'responds 405')
        done() ; test.end() })
      .end() }) })

