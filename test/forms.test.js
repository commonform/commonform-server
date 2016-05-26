var concat = require('concat-stream')
var http = require('http')
var normalize = require('commonform-normalize')
var server = require('./server')
var tape = require('tape')
var makeInfiniteStream = require('./infinite-stream')

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

tape('POST /forms with infinite request body', function(test) {
  server(function(port, done) {
    var request = { method: 'POST', path: '/forms', port: port }
    makeInfiniteStream()
      .pipe(http.request(request, function(response) {
        test.equal(response.statusCode, 413, 'responds 413')
        done() ; test.end() })) }) })

tape('POST /forms without request body', function(test) {
  server(function(port, done) {
    var request = { method: 'POST', path: '/forms', port: port }
    http
      .request(request, function(response) {
        test.equal(response.statusCode, 400, 'responds 400')
        done() ; test.end() })
      .end() }) })

// The following test does not work correctly.

// This test errors out on the client side. The response handler is
// never called. There is no such problem when the Content-Length header
// is either omitted or correct.

// tape('POST /forms with low Content-Length', function(test) {
//   server(function(port, done) {
//     var form = { content: [ 'Just a test' ] }
//     var json = JSON.stringify(form)
//     var request =
//       { method: 'POST',
//         path: '/forms',
//         headers: { 'Content-Length': ( Buffer.byteLength(json) - 1 ) },
//         port: port }
//     http
//       .request(request, function(response) {
//         test.equal(response.statusCode, 408, 'responds 408')
//         done() ; test.end() })
//     .end(json) }) })

if (process.env.RUN_SLOW_TESTS) {
  tape('POST /forms with high Content-Length', function(test) {
    server(function(port, done) {
      var form = { content: [ 'Just a test' ] }
      var json = JSON.stringify(form)
      var request =
        { method: 'POST',
          path: '/forms',
          headers: { 'Content-Length': ( Buffer.byteLength(json) + 1 ) },
          port: port }
      http
        .request(request, function(response) {
          test.equal(response.statusCode, 408, 'responds 408')
          done() ; test.end() })
        .end(json) }) }) }

tape('POST /forms with invalid form', function(test) {
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
          test.equal(
            response.headers['content-type'], 'application/json',
            'sets Content-Type')
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
          test.equal(
            response.headers['content-type'], 'application/json',
            'sets Content-Type')
          response.pipe(concat(function(buffer) {
            test.same(JSON.parse(buffer), child, 'serves the child form')
            done() ; test.end() })) }) })
      .end(JSON.stringify(parent)) }) })

tape('GET /forms/$great_grandchild_of_posted', function(test) {
  server(function(port, done) {
    var greatgrandchild = { content: [ 'Great Grandchild' ] }
    var grandchild = { content: [ { form: greatgrandchild } ] }
    var child = { content: [ { form: grandchild } ] }
    var parent = { content: [ { form: child } ] }
    var digest = normalize(greatgrandchild).root
    var post = { method: 'POST', path: '/forms', port: port }
    http
      .request(post, function(response) {
        test.equal(response.statusCode, 201, 'responds 201')
        setTimeout(
          function checkGetRequest() {
            var get = { path: ( '/forms/' + digest ), port: port }
            http.get(get, function(response) {
              test.equal(
                response.headers['content-type'], 'application/json',
                'sets Content-Type')
              response.pipe(concat(function(buffer) {
                test.same(
                  JSON.parse(buffer), greatgrandchild,
                  'serves the great granchild form')
                done() ; test.end() })) }) },
          200) })
      .end(JSON.stringify(parent)) }) })

tape('PUT /forms', function(test) {
  server(function(port, done) {
    var request = { method: 'PUT', path: '/forms', port: port }
    http
      .request(request, function(response) {
        test.equal(response.statusCode, 405, 'responds 405')
        done() ; test.end() })
      .end() }) })
