var http = require('http')
var normalize = require('commonform-normalize')
var series = require('async-series')
var server = require('./server')
var tape = require('tape')

tape('GET /terms/$term/definitions', function(test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var formA = { content: [ { definition: 'Lots' }, ' means two.' ] }
  var digestA = normalize(formA).root
  var formB = { content: [ { definition: 'Lots' }, ' means three.' ] }
  var digestB = normalize(formB).root
  server(function(port, closeServer) {
    series(
      [ function postFormA(done) {
          http.request({ method: 'POST', port: port, path: '/forms' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST form 201')
              done() })
            .end(JSON.stringify(formA)) },
        function postFormB(done) {
          http.request({ method: 'POST', port: port, path: '/forms' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST form 201')
              done() })
            .end(JSON.stringify(formB)) },
        function postProject(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path: '/publishers/ana/projects/defineslots/editions/1e' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST project 201')
              done() })
            .end(JSON.stringify({ digest: digestA })) },
        function getDefinitions(done) {
          http.request(
            { method: 'GET',
              port: port,
              path: '/terms/Lots/definitions' },
            function(response) {
              var buffer = [ ]
              response
                .on('data', function(chunk) { buffer.push(chunk) })
                .on('end', function() {
                  var body = JSON.parse(Buffer.concat(buffer))
                  test.assert(Array.isArray(body), 'serves a JSON array')
                  test.assert(
                    body.includes(digestA),
                    'serves project form digest')
                  test.assert(
                    !body.includes(digestB),
                    'does not serve non-project form digest')
                  done() }) })
            .end() } ],
      function finish() {
        closeServer()
        test.end() }) }) })

tape('GET /terms/$term/uses', function(test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var formA = { content: [ 'Give us ',{ use: 'Lots' } ] }
  var digestA = normalize(formA).root
  var formB = { content: [ 'Give me ',{ use: 'Lots' } ] }
  var digestB = normalize(formB).root
  server(function(port, closeServer) {
    series(
      [ function postFormA(done) {
          http.request({ method: 'POST', port: port, path: '/forms' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST form 201')
              done() })
            .end(JSON.stringify(formA)) },
        function postFormB(done) {
          http.request({ method: 'POST', port: port, path: '/forms' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST form 201')
              done() })
            .end(JSON.stringify(formB)) },
        function postProject(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path: '/publishers/ana/projects/useslots/editions/1e' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST project 201')
              done() })
            .end(JSON.stringify({ digest: digestA })) },
        function getDefinitions(done) {
          http.request(
            { method: 'GET',
              port: port,
              path: '/terms/Lots/uses' },
            function(response) {
              var buffer = [ ]
              response
                .on('data', function(chunk) { buffer.push(chunk) })
                .on('end', function() {
                  var body = JSON.parse(Buffer.concat(buffer))
                  test.assert(Array.isArray(body), 'serves a JSON array')
                  test.assert(
                    body.includes(digestA),
                    'serves project form digest')
                  test.assert(
                    !body.includes(digestB),
                    'does not serve non-project form digest')
                  done() }) })
            .end() } ],
      function finish() {
        closeServer()
        test.end() }) }) })

tape('GET /forms/$digest/parents', function(test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var child = { content: [ 'Some content' ] }
  var childDigest = normalize(child).root
  var parent = { content: [ 'Hooray!', { form: child } ] }
  var parentDigest = normalize(parent).root
  var grandparent = { content: [ 'More!', { form: parent } ] }
  var grandparentDigest = normalize(grandparent).root
  server(function(port, closeServer) {
    series(
      [ function postForm(done) {
          http.request({ method: 'POST', port: port, path: '/forms' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST form 201')
              done() })
            .end(JSON.stringify(grandparent)) },
        function postProject(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path: '/publishers/ana/projects/parent/editions/1e' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST project 201')
              done() })
            .end(JSON.stringify({ digest: grandparentDigest })) },
        function getParents(done) {
          http.request(
            { method: 'GET',
              port: port,
              path: ( '/forms/' + childDigest + '/parents' ) },
            function(response) {
              var buffer = [ ]
              response
                .on('data', function(chunk) { buffer.push(chunk) })
                .on('end', function() {
                  var body = JSON.parse(Buffer.concat(buffer))
                  test.assert(Array.isArray(body), 'serves a JSON array')
                  test.assert(
                    body.some(function(element) {
                      return (
                        ( element.digest === parentDigest ) &&
                        element.depth === 0 ) }),
                    'serves parent')
                  test.assert(
                    body.some(function(element) {
                      return (
                        ( element.digest === grandparentDigest ) &&
                        ( element.depth === 1 ) ) }),
                    'serves grandparent')
                  done() }) })
            .end() } ],
      function finish() {
        closeServer()
        test.end() }) }) })

tape('GET /headings/$heading/forms', function(test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var heading = 'X'
  var child = { content: [ 'Some content' ] }
  var childDigest = normalize(child).root
  var parent = { content: [ { heading: heading, form: child } ] }
  var parentDigest = normalize(parent).root
  server(function(port, closeServer) {
    series(
      [ function postForm(done) {
          http.request({ method: 'POST', port: port, path: '/forms' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST form 201')
              done() })
            .end(JSON.stringify(parent)) },
        function postProject(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path: '/publishers/ana/projects/parent/editions/1e' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST project 201')
              done() })
            .end(JSON.stringify({ digest: parentDigest })) },
        function getParents(done) {
          http.request(
            { method: 'GET',
              port: port,
              path: ( '/headings/' + heading + '/forms' ) },
            function(response) {
              var buffer = [ ]
              response
                .on('data', function(chunk) { buffer.push(chunk) })
                .on('end', function() {
                  var body = JSON.parse(Buffer.concat(buffer))
                  test.assert(Array.isArray(body), 'serves a JSON array')
                  test.assert(
                    body.some(function(element) {
                      return (
                        ( element.digest === childDigest ) &&
                        ( element.parent === parentDigest ) ) }),
                    'serves parent')
                  done() }) })
            .end() } ],
      function finish() {
        closeServer()
        test.end() }) }) })

tape('GET /forms/$form/headings', function(test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var heading = 'X'
  var child = { content: [ 'Some content' ] }
  var childDigest = normalize(child).root
  var parent = { content: [ { heading: heading, form: child } ] }
  var parentDigest = normalize(parent).root
  server(function(port, closeServer) {
    series(
      [ function postForm(done) {
          http.request({ method: 'POST', port: port, path: '/forms' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST form 201')
              done() })
            .end(JSON.stringify(parent)) },
        function postProject(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path: '/publishers/ana/projects/parent/editions/1e' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST project 201')
              done() })
            .end(JSON.stringify({ digest: parentDigest })) },
        function getParents(done) {
          http.request(
            { method: 'GET',
              port: port,
              path: ( '/forms/' + childDigest + '/headings' ) },
            function(response) {
              var buffer = [ ]
              response
                .on('data', function(chunk) { buffer.push(chunk) })
                .on('end', function() {
                  var body = JSON.parse(Buffer.concat(buffer))
                  test.assert(Array.isArray(body), 'serves a JSON array')
                  test.assert(
                    body.some(function(element) {
                      return (
                        ( element.heading === heading ) &&
                        ( element.parent === parentDigest ) ) }),
                    'serves heading in parent')
                  done() }) })
            .end() } ],
      function finish() {
        closeServer()
        test.end() }) }) })

tape('GET /headings/$heading/references', function(test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var heading = 'X'
  var form = { content: [ { reference: heading } ] }
  var digest = normalize(form).root
  server(function(port, closeServer) {
    series(
      [ function postForm(done) {
          http.request({ method: 'POST', port: port, path: '/forms' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST form 201')
              done() })
            .end(JSON.stringify(form)) },
        function postProject(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path: '/publishers/ana/projects/parent/editions/1e' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST project 201')
              done() })
            .end(JSON.stringify({ digest: digest })) },
        function getReferences(done) {
          http.request(
            { method: 'GET',
              port: port,
              path: ( '/headings/' + heading + '/references' ) },
            function(response) {
              var buffer = [ ]
              response
                .on('data', function(chunk) { buffer.push(chunk) })
                .on('end', function() {
                  var body = JSON.parse(Buffer.concat(buffer))
                  test.assert(Array.isArray(body), 'serves a JSON array')
                  test.assert(body.includes(digest), 'serves form')
                  done() }) })
            .end() } ],
      function finish() {
        closeServer()
        test.end() }) }) })

tape('GET /headings', function(test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var heading = 'X'
  var form = { content: [ { reference: heading } ] }
  var digest = normalize(form).root
  server(function(port, closeServer) {
    series(
      [ function postForm(done) {
          http.request({ method: 'POST', port: port, path: '/forms' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST form 201')
              done() })
            .end(JSON.stringify(form)) },
        function postProject(done) {
          http.request(
            { auth: ( publisher + ':' + password ),
              method: 'POST',
              port: port,
              path: '/publishers/ana/projects/parent/editions/1e' },
            function(response) {
              test.equal(response.statusCode, 201, 'POST project 201')
              done() })
            .end(JSON.stringify({ digest: digest })) },
        function getHeadings(done) {
          http.request(
            { method: 'GET', port: port, path: '/headings' },
            function(response) {
              var buffer = [ ]
              response
                .on('data', function(chunk) { buffer.push(chunk) })
                .on('end', function() {
                  var body = JSON.parse(Buffer.concat(buffer))
                  test.assert(Array.isArray(body), 'serves a JSON array')
                  test.assert(body.includes(heading), 'serves heading')
                  done() }) })
            .end() } ],
      function finish() {
        closeServer()
        test.end() }) }) })
