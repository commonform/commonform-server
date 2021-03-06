var concat = require('./concat')
var http = require('http')
var normalize = require('commonform-normalize')
var postForm = require('./post-form')
var postProject = require('./post-project')
var series = require('./series')
var server = require('./server')
var setDescription = require('./set-description')
var tape = require('tape')

tape(
  'GET /publishers/{publisher}/projects/{project}/publications',
  function (test) {
    var publisher = 'ana'
    var password = 'ana\'s password'
    var form = { content: ['A test form'] }
    var digest = normalize(form).root
    server(function (port, closeServer) {
      series(
        [
          postForm(port, publisher, password, form, test),
          postProject(
            publisher, password, port,
            'nda', '1e',
            digest, false, false,
            test
          ),
          postProject(
            publisher, password, port,
            'nda', '1e1u',
            digest, false, false,
            test
          ),
          function (done) {
            var options = {
              method: 'GET',
              port: port,
              path: '/publishers/ana/projects/nda/publications'
            }
            http.request(options, function (response) {
              concat(test, response, function (body) {
                test.deepEqual(
                  body, ['1e', '1e1u'],
                  'GET publications JSON'
                )
                done()
              })
            })
              .end()
          }
        ],
        function finish () {
          closeServer()
          test.end()
        }
      )
    })
  }
)

tape(
  'GET /publishers/{publisher}/projects/{nonexistent}/publications',
  function (test) {
    server(function (port, closeServer) {
      var options = {
        method: 'GET',
        port: port,
        path: '/publishers/ana/projects/nonexistent/publications'
      }
      http.request(options, function (response) {
        test.equal(response.statusCode, 404)
        closeServer()
        test.end()
      })
        .end()
    })
  }
)

tape(
  'PUT /publishers/{publisher}/projects/{project}/publications',
  function (test) {
    server(function (port, done) {
      var options = {
        method: 'PUT',
        port: port,
        path: '/publishers/ana/projects/nda/publications'
      }
      http.request(options, function (response) {
        test.equal(response.statusCode, 405, 'responds 405')
        done()
        test.end()
      })
        .end()
    })
  }
)

tape(
  'GET /publishers/{publisher}/projects/{project}/dependents',
  function (test) {
    var publisher = 'ana'
    var password = 'ana\'s password'
    var component = { content: ['A test form'] }
    var componentDigest = normalize(component).root
    var dependent = {
      content: [
        {
          repository: 'api.commonform.org',
          publisher: publisher,
          project: 'component',
          edition: '1e',
          substitutions: { terms: {}, headings: {} }
        }
      ]
    }
    var dependentDigest = normalize(dependent).root
    server(function (port, closeServer) {
      series(
        [
          postForm(port, publisher, password, component, test),
          postProject(
            publisher, password, port,
            'component', '1e',
            componentDigest, false, false,
            test
          ),
          postForm(port, publisher, password, dependent, test),
          postProject(
            publisher, password, port,
            'dependent', '1e',
            dependentDigest, false, false,
            test
          ),
          function (done) {
            var options = {
              method: 'GET',
              port: port,
              path: '/publishers/ana/projects/component/dependents'
            }
            http.request(options, function (response) {
              concat(test, response, function (body) {
                test.deepEqual(
                  body, [{ digest: dependentDigest, depth: 0 }],
                  'GET publications JSON'
                )
                done()
              })
            })
              .end()
          }
        ],
        function finish () {
          closeServer()
          test.end()
        }
      )
    })
  }
)

tape(
  'GET /publishers/{publisher}/projects/{project}/description',
  function (test) {
    var publisher = 'ana'
    var password = 'ana\'s password'
    var project = 'with-description'
    var form = { content: ['A test form'] }
    var digest = normalize(form).root
    server(function (port, closeServer) {
      series(
        [
          postForm(port, publisher, password, form, test),
          postProject(
            publisher, password, port,
            project, '1e',
            digest, false, false,
            test
          ),
          function (done) {
            var options = {
              method: 'GET',
              port: port,
              path: '/publishers/ana/projects/with-description/description'
            }
            http.request(options, function (response) {
              concat(test, response, function (body) {
                test.deepEqual(
                  body, null,
                  'GET description null'
                )
                done()
              })
            })
              .end()
          }
        ],
        function finish () {
          closeServer()
          test.end()
        }
      )
    })
  }
)

tape(
  'POST /publishers/{publisher}/projects/{project}/description',
  function (test) {
    var publisher = 'ana'
    var password = 'ana\'s password'
    var project = 'with-description'
    var form = { content: ['A test form'] }
    var digest = normalize(form).root
    var descriptionPath = '/publishers/ana/projects/with-description/description'
    var description = 'test description'
    server(function (port, closeServer) {
      series(
        [
          postForm(port, publisher, password, form, test),
          postProject(
            publisher, password, port,
            project, '1e',
            digest, false, false,
            test
          ),
          setDescription(
            publisher, password, port,
            project, description,
            test
          ),
          function (done) {
            var options = {
              method: 'GET',
              port: port,
              path: descriptionPath
            }
            http.request(options, function (response) {
              concat(test, response, function (body) {
                test.deepEqual(
                  body, description,
                  'GET description'
                )
                done()
              })
            })
              .end()
          }
        ],
        function finish () {
          closeServer()
          test.end()
        }
      )
    })
  }
)

tape(
  'POST /publishers/{publisher}/projects/{project}/description twice',
  function (test) {
    var publisher = 'ana'
    var password = 'ana\'s password'
    var project = 'with-description'
    var form = { content: ['A test form'] }
    var digest = normalize(form).root
    var descriptionPath = '/publishers/ana/projects/with-description/description'
    var firstDescription = 'first description'
    var secondDescription = 'second description'
    test.notEqual(firstDescription, secondDescription, 'descriptions not equal')
    server(function (port, closeServer) {
      series(
        [
          postForm(port, publisher, password, form, test),
          postProject(
            publisher, password, port,
            project, '1e',
            digest, false, false,
            test
          ),
          setDescription(
            publisher, password, port,
            project, firstDescription,
            test
          ),
          setDescription(
            publisher, password, port,
            project, secondDescription,
            test
          ),
          function (done) {
            var options = {
              method: 'GET',
              port: port,
              path: descriptionPath
            }
            http.request(options, function (response) {
              concat(test, response, function (body) {
                test.deepEqual(
                  body, secondDescription,
                  'GET description'
                )
                done()
              })
            })
              .end()
          }
        ],
        function finish () {
          closeServer()
          test.end()
        }
      )
    })
  }
)
