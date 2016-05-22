var concat = require('concat-stream')
var http = require('http')
var normalize = require('commonform-normalize')
var series = require('async-series')
var server = require('./server')
var tape = require('tape')

tape('POST /publishers/$publisher/projects/$project/editions/$edition', function(test) {
  test.plan(3)
  var publisher = 'ana'
  var password = 'ana\'s password'
  var project = 'nda'
  var edition = '1e'
  var form = { content: [ 'A test form' ] }
  var digest = normalize(form).root
  var path =
    ( '/publishers/' + publisher +
      '/projects/' + project +
      '/editions/' + edition )
  server(function(port, done) {
    var request =
      { auth: ( publisher + ':' + password ),
        method: 'POST',
        port: port,
        path: path }
    series(
      [ function putForm(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path: '/forms' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST 201')
              done() })
            .end(JSON.stringify(form)) },
        function putProject(done) {
          http.request(request, function(response) {
            test.equal(response.statusCode, 201, '201')
            test.equal(response.headers.location, path, 'Location')
            done() })
            .end(JSON.stringify({ digest: digest })) } ],
      function finish() {
        done()
        test.end() }) }) })

tape('POST /publishers/$other-publisher/projects/$project/editions/$edition', function(test) {
  test.plan(1)
  var publisher = 'ana'
  var password = 'ana\'s password'
  var otherPublisher = 'bob'
  var project = 'nda'
  var edition = '1e'
  var digest = 'a'.repeat(64)
  var path =
    ( '/publishers/' + otherPublisher +
      '/projects/' + project +
      '/editions/' + edition )
  server(function(port, done) {
    http.request(
      { auth: ( publisher + ':' + password ),
        method: 'POST',
        port: port,
        path: path },
      function(response) {
        test.equal(response.statusCode, 401, '401')
        done()
        test.end() })
      .end(JSON.stringify({ digest: digest })) }) })

tape('POST /publishers/$publisher/projects/$Invalid-project/editions/$edition', function(test) {
  test.plan(2)
  var publisher = 'ana'
  var password = 'ana\'s password'
  var project = 'no_underscores_allowed'
  var edition = '1e'
  var digest = 'a'.repeat(64)
  var path =
    ( '/publishers/' + publisher +
      '/projects/' + project +
      '/editions/' + edition )
  server(function(port, done) {
    http.request(
      { auth: ( publisher + ':' + password ),
        method: 'POST',
        port: port,
        path: path },
      function(response) {
        test.equal(response.statusCode, 400, '400')
        response.pipe(concat(function(buffer) {
          test.equal(buffer.toString(), 'invalid project name', 'invalid name')
          done()
          test.end() })) })
      .end(JSON.stringify({ digest: digest })) }) })

tape('POST /publishers/$publisher/projects/$project/editions/$invalid-edition', function(test) {
  test.plan(2)
  var publisher = 'ana'
  var password = 'ana\'s password'
  var project = 'da'
  var edition = '1.0.0'
  var digest = 'a'.repeat(64)
  var path =
    ( '/publishers/' + publisher +
      '/projects/' + project +
      '/editions/' + edition )
  server(function(port, done) {
    http.request(
      { auth: ( publisher + ':' + password ),
        method: 'POST',
        port: port,
        path: path },
      function(response) {
        test.equal(response.statusCode, 400, '400')
        response.pipe(concat(function(buffer) {
          test.equal(buffer.toString(), 'invalid edition', 'invalid edition')
          done()
          test.end() })) })
      .end(JSON.stringify({ digest: digest })) }) })

tape('POST /publishers/$publisher/projects/$project/editions/$edition with invalid digest', function(test) {
  test.plan(2)
  var publisher = 'ana'
  var password = 'ana\'s password'
  var project = 'da'
  var edition = '1e'
  var digest = 'blah'
  var path =
    ( '/publishers/' + publisher +
      '/projects/' + project +
      '/editions/' + edition )
  server(function(port, done) {
    http.request(
      { auth: ( publisher + ':' + password ),
        method: 'POST',
        port: port,
        path: path },
      function(response) {
        test.equal(response.statusCode, 400, '400')
        response.pipe(concat(function(buffer) {
          test.equal(buffer.toString(), 'invalid digest', 'invalid digest')
          done()
          test.end() })) })
      .end(JSON.stringify({ digest: digest })) }) })

tape('POST /publishers/$publisher/projects/$project/editions/$edition with invalid JSON', function(test) {
  test.plan(2)
  var publisher = 'ana'
  var password = 'ana\'s password'
  var project = 'nda'
  var edition = '1e'
  var digest = 'a'.repeat(64)
  var path =
    ( '/publishers/' + publisher +
      '/projects/' + project +
      '/editions/' + edition )
  server(function(port, done) {
    http.request(
      { auth: ( publisher + ':' + password ),
        method: 'POST',
        port: port,
        path: path },
      function(response) {
        test.equal(response.statusCode, 400, '400')
        response.pipe(concat(function(buffer) {
          test.equal(buffer.toString(), 'invalid JSON', 'invalid JSON')
          done()
          test.end() })) })
      .end('The form is ' + digest) }) })

tape('POST /publishers/$publisher/projects/$project/editions/$edition with bad password', function(test) {
  test.plan(1)
  var publisher = 'ana'
  var password = 'not ana\'s password'
  var project = 'nda'
  var edition = '1e'
  var digest = 'a'.repeat(64)
  var path =
    ( '/publishers/' + publisher +
      '/projects/' + project +
      '/editions/' + edition )
  server(function(port, done) {
    http.request(
      { auth: ( publisher + ':' + password ),
        method: 'POST',
        port: port,
        path: path },
      function(response) {
        test.equal(response.statusCode, 401, '401')
        done()
        test.end() })
      .end(JSON.stringify({ digest: digest })) }) })

tape('POST /publishers/$publisher/projects/$project/editions/$existing', function(test) {
  test.plan(3)
  var publisher = 'ana'
  var password = 'ana\'s password'
  var project = 'nda'
  var edition = '1e'
  var form = { content: [ 'A test form' ] }
  var digest = normalize(form).root
  var path =
    ( '/publishers/' + publisher +
      '/projects/' + project +
      '/editions/' + edition )
  server(function(port, done) {
    var request =
      { auth: ( publisher + ':' + password ),
        method: 'POST',
        port: port,
        path: path }
    series(
      [ function putForm(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path: '/forms' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST 201')
              done() })
            .end(JSON.stringify(form)) },
        function putProject(done) {
          http.request(request, function(response) {
            test.equal(response.statusCode, 201, 'First POST 201')
            done() })
            .end(JSON.stringify({ digest: digest })) },
        function putProjectAgain(done) {
          http.request(request, function(response) {
            test.equal(response.statusCode, 409, 'Second POST 409')
            done() })
            .end(JSON.stringify({ digest: digest })) } ],
      function finish() {
        done()
        test.end() }) }) })

tape('GET /publishers/$publisher/projects/$project/editions/$nonexistent', function(test) {
  test.plan(1)
  var publisher = 'ana'
  var project = 'nda'
  var edition = '1e'
  server(function(port, done) {
    http.request(
      { method: 'GET',
        port: port,
        path:
          ( '/publishers/' + publisher +
            '/projects/' + project +
            '/editions/' + edition ) },
      function(response) {
        test.equal(response.statusCode, 404, '404')
        done()
        test.end() })
      .end() }) })

tape('GET /publishers/$publisher/projects/$project/editions/$existing', function(test) {
  test.plan(4)
  var publisher = 'ana'
  var password = 'ana\'s password'
  var project = 'nda'
  var edition = '1e'
  var form = { content: [ 'A test form' ] }
  var digest = normalize(form).root
  var path =
    ( '/publishers/' + publisher +
      '/projects/' + project +
      '/editions/' + edition )
  server(function(port, done) {
    series(
      [ function putForm(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path: '/forms' },
            function(response) {
              test.equal(
                response.statusCode, 201,
                'POST form 201')
              done() })
            .end(JSON.stringify(form)) },
        function putProject(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path: path },
            function(response) {
              test.equal(
                response.statusCode, 201,
                'POST project 201')
              done() })
            .end(JSON.stringify({ digest: digest })) },
        function getProject(done) {
          http.request(
            { method: 'GET', port: port, path: path },
            function(response) {
              test.equal(response.statusCode, 200, 'GET 200')
              response.pipe(concat(function(buffer) {
                var responseBody = JSON.parse(buffer)
                test.equal(
                  responseBody.digest, digest,
                  'GET project JSON')
                done() })) })
            .end() } ],
      function finish() {
        done()
        test.end() }) }) })

tape('GET /publishers/$publisher/projects', function(test) {
  test.plan(3)
  var publisher = 'ana'
  var password = 'ana\'s password'
  var project = 'nda'
  var edition = '1e'
  var form = { content: [ 'A test form' ] }
  var digest = normalize(form).root
  server(function(port, done) {
    series(
      [ function putForm(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path: '/forms' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST 201')
              done() })
            .end(JSON.stringify(form)) },
        function putProject(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path:
                ( '/publishers/' + publisher +
                  '/projects/' + project +
                  '/editions/' + edition ) },
            function(response) {
              test.equal(response.statusCode, 201, 'POST 201')
              done() })
            .end(JSON.stringify({ digest: digest })) },
        function getProject(done) {
          http.request(
            { method: 'GET',
              port: port,
              path: ( '/publishers/' + publisher + '/projects' ) },
            function(response) {
              response.pipe(concat(function(buffer) {
                var responseBody = JSON.parse(buffer)
                test.deepEqual(
                  responseBody,
                  [ project ],
                  'GET projects JSON')
                done() })) })
            .end() } ],
      function finish() {
        done()
        test.end() }) }) })

tape('GET /publishers/$publisher/projects/$project/editions/current', function(test) {
  test.plan(3)
  var publisher = 'ana'
  var password = 'ana\'s password'
  var project = 'nda'
  var edition = '2e'
  var form = { content: [ 'A test form' ] }
  var digest = normalize(form).root
  server(function(port, done) {
    series(
      [ function putForm(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path: '/forms' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST 201')
              done() })
            .end(JSON.stringify(form)) },
        function putProject(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path:
                ( '/publishers/' + publisher +
                  '/projects/' + project +
                  '/editions/' + edition ) },
            function(response) {
              test.equal(response.statusCode, 201, 'POST 201')
              done() })
            .end(JSON.stringify({ digest: digest })) },
        function getProject(done) {
          http.request(
            { method: 'GET',
              port: port,
              path:
                ( '/publishers/' + publisher +
                  '/projects/' + project +
                  '/editions/current' ) },
            function(response) {
              response.pipe(concat(function(buffer) {
                var responseBody = JSON.parse(buffer)
                test.equal(responseBody.digest, digest, 'GET project JSON')
                done() })) })
            .end() } ],
      function finish() {
        done()
        test.end() }) }) })

tape('GET /publishers/$publisher/projects/$project/editions/latest', function(test) {
  test.plan(3)
  var publisher = 'ana'
  var password = 'ana\'s password'
  var project = 'nda'
  var edition = '2e'
  var form = { content: [ 'A test form' ] }
  var digest = normalize(form).root
  server(function(port, done) {
    series(
      [ function putForm(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path: '/forms' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST 201')
              done() })
            .end(JSON.stringify(form)) },
        function putProject(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path:
                ( '/publishers/' + publisher +
                  '/projects/' + project +
                  '/editions/' + edition ) },
            function(response) {
              test.equal(response.statusCode, 201, 'POST 201')
              done() })
            .end(JSON.stringify({ digest: digest })) },
        function getProject(done) {
          http.request(
            { method: 'GET',
              port: port,
              path:
                ( '/publishers/' + publisher +
                  '/projects/' + project +
                  '/editions/latest' ) },
            function(response) {
              response.pipe(concat(function(buffer) {
                var responseBody = JSON.parse(buffer)
                test.equal(responseBody.digest, digest, 'GET project JSON')
                done() })) })
            .end() } ],
      function finish() {
        done()
        test.end() }) }) })

tape('GET /publishers/$publisher/projects/$project/editions/$existing/form', function(test) {
  test.plan(4)
  var publisher = 'ana'
  var password = 'ana\'s password'
  var project = 'nda'
  var edition = '1e'
  var form = { content: [ 'A test form' ] }
  var digest = normalize(form).root
  server(function(port, done) {
    series(
      [ function putForm(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path: '/forms' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST form 201')
              done() })
            .end(JSON.stringify(form)) },
        function putProject(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path:
                ( '/publishers/' + publisher +
                  '/projects/' + project +
                  '/editions/' + edition ) },
            function(response) {
              test.equal(response.statusCode, 201, 'POST 201')
              done() })
            .end(JSON.stringify({ digest: digest })) },
        function getProject(done) {
          http.request(
            { method: 'GET',
              port: port,
              path:
                ( '/publishers/' + publisher +
                  '/projects/' + project +
                  '/editions/' + edition +
                  '/form' ) },
            function(response) {
              test.equal(response.statusCode, 301, 'GET 301')
              test.equal(
                response.headers.location,
                ( 'https://api.commonform.org/forms/' + digest ),
                'GET api.commonform.org/forms/...')
              done() })
            .end() } ],
      function finish() {
        done()
        test.end() }) }) })

tape('GET /publishers/$publisher/projects/$project/editions/current/form', function(test) {
  test.plan(4)
  var publisher = 'ana'
  var password = 'ana\'s password'
  var project = 'nda'
  var edition = '1e'
  var form = { content: [ 'A test form' ] }
  var digest = normalize(form).root
  server(function(port, done) {
    series(
      [ function putForm(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path: '/forms' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST 201')
              done() })
            .end(JSON.stringify(form)) },
        function putProject(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path:
                ( '/publishers/' + publisher +
                  '/projects/' + project +
                  '/editions/' + edition ) },
            function(response) {
              test.equal(response.statusCode, 201, 'POST 201')
              done() })
            .end(JSON.stringify({ digest: digest })) },
        function getProject(done) {
          http.request(
            { method: 'GET',
              port: port,
              path:
                ( '/publishers/' + publisher +
                  '/projects/' + project +
                  '/editions/current/form' ) },
            function(response) {
              test.equal(response.statusCode, 301, 'GET 301')
              test.equal(
                response.headers.location,
                ( 'https://api.commonform.org/forms/' + digest ),
                'GET api.commonform.org/forms/...')
              done() })
            .end() } ],
      function finish() {
        done()
        test.end() }) }) })

tape('GET /publishers/$publisher/projects/$project/editions/latest/form', function(test) {
  test.plan(4)
  var publisher = 'ana'
  var password = 'ana\'s password'
  var project = 'nda'
  var edition = '1e'
  var form = { content: [ 'A test form' ] }
  var digest = normalize(form).root
  server(function(port, done) {
    series(
      [ function putForm(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path: '/forms' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST form 201')
              done() })
            .end(JSON.stringify(form)) },
        function putProject(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path:
                ( '/publishers/' + publisher +
                  '/projects/' + project +
                  '/editions/' + edition ) },
            function(response) {
              test.equal(response.statusCode, 201, 'POST project 201')
              done() })
            .end(JSON.stringify({ digest: digest })) },
        function getProject(done) {
          http.request(
            { method: 'GET',
              port: port,
              path:
                ( '/publishers/' + publisher +
                  '/projects/' + project +
                  '/editions/latest/form' ) },
            function(response) {
              test.equal(response.statusCode, 301, 'GET 301')
              test.equal(
                response.headers.location,
                ( 'https://api.commonform.org/forms/' + digest ),
                'GET api.commonform.org/forms/...')
              done() })
            .end() } ],
      function finish() {
        done()
        test.end() }) }) })

tape('PUT /publishers/$publisher/projects/$project/editions/$edition', function(test) {
  test.plan(1)
  var publisher = 'ana'
  var project = 'nda'
  var edition = '1e'
  server(function(port, done) {
    http.request(
      { method: 'PUT',
        port: port,
        path:
          ( '/publishers/' + publisher +
            '/projects/' + project +
            '/editions/' + edition ) },
      function(response) {
        test.equal(response.statusCode, 405, '405')
        done()
        test.end() })
      .end() }) })

tape('PUT /publishers/$publisher/projects/$project/editions/$edition/form', function(test) {
  test.plan(1)
  var publisher = 'ana'
  var project = 'nda'
  var edition = '1e'
  server(function(port, done) {
    http.request(
      { method: 'PUT',
        port: port,
        path:
          ( '/publishers/' + publisher +
            '/projects/' + project +
            '/editions/' + edition +
            '/form' ) },
      function(response) {
        test.equal(response.statusCode, 405, '405')
        done()
        test.end() })
      .end() }) })

tape('GET /forms/$form/projects', function(test) {
  test.plan(3)
  var publisher = 'ana'
  var password = 'ana\'s password'
  var project = 'nda'
  var edition = '1e'
  var form = { content: [ 'A test form' ] }
  var digest = normalize(form).root
  server(function(port, done) {
    series(
      [ function putForm(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path: '/forms' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST 201')
              done() })
            .end(JSON.stringify(form)) },
        function putProject(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path:
                ( '/publishers/' + publisher +
                  '/projects/' + project +
                  '/editions/' + edition ) },
            function(response) {
              test.equal(response.statusCode, 201, 'POST 201')
              done() })
            .end(JSON.stringify({ digest: digest })) },
        function getProjects(done) {
          http.request(
            { method: 'GET',
              port: port,
              path: ( '/forms/' + digest + '/projects' ) },
            function(response) {
              response.pipe(concat(function(buffer) {
                var responseBody = JSON.parse(buffer)
                test.same(
                  responseBody,
                  [ { publisher: publisher,
                      project: project,
                      edition: edition,
                      root: true,
                      digest: digest } ],
                  'GET projects JSON')
                done() })) })
            .end() } ],
      function finish() {
        done()
        test.end() }) }) })

tape('GET /forms/$form/projects for a child form', function(test) {
  test.plan(3)
  var publisher = 'ana'
  var password = 'ana\'s password'
  var project = 'nda'
  var edition = '1e'
  var child = { content: [ 'A test form' ] }
  var parent = { content: [ { form: child } ] }
  var parentDigest = normalize(parent).root
  var childDigest = normalize(child).root
  server(function(port, done) {
    series(
      [ function putForm(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path: '/forms' },
            function(response) {
              test.equal(
                response.statusCode, 201,
                'POST form 201')
              done() })
            .end(JSON.stringify(parent)) },
        function putProject(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path:
                ( '/publishers/' + publisher +
                  '/projects/' + project +
                  '/editions/' + edition ) },
            function(response) {
              test.equal(
                response.statusCode, 201,
                'POST project 201')
              done() })
            .end(JSON.stringify({ digest: parentDigest })) },
        function getProjects(done) {
          http.request(
            { method: 'GET',
              port: port,
              path: ( '/forms/' + childDigest + '/projects' ) },
            function(response) {
              response.pipe(concat(function(buffer) {
                var responseBody = JSON.parse(buffer)
                test.same(
                  responseBody,
                  [ { publisher: publisher,
                      project: project,
                      edition: edition,
                      root: false,
                      digest: childDigest } ],
                  'GET projects JSON')
                done() })) })
            .end() } ],
      function finish() {
        done()
        test.end() }) }) })
