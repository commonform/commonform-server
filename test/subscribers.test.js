var http = require('http')
var mailgun = require('../mailgun')
var normalize = require('commonform-normalize')
var postAnnotation = require('./post-annotation')
var postForm = require('./post-form')
var postProject = require('./post-project')
var series = require('./series')
var server = require('./server')
var subscribeToAnnotation = require('./subscribe-to-annotation')
var subscribeToEdition = require('./subscribe-to-publication')
var subscribeToForm = require('./subscribe-to-form')
var subscribeToProject = require('./subscribe-to-project')
var subscribeToPublisher = require('./subscribe-to-publisher')
var tape = require('tape')
var unsubscribeFromAnnotation = require('./unsubscribe-from-annotation')
var unsubscribeFromEdition = require('./unsubscribe-from-publication')
var unsubscribeFromForm = require('./unsubscribe-from-form')
var unsubscribeFromProject = require('./unsubscribe-from-project')
var unsubscribeFromPublisher = require('./unsubscribe-from-publisher')

var publisher = 'ana'
var password = 'ana\'s password'
var email = 'ana@example.com'
var form = { content: ['The child'] }
var digest = normalize(form).root
var annotation = {
  publisher: publisher,
  form: digest,
  context: digest,
  replyTo: [],
  text: 'Not good'
}
var project = 'nda'
var edition = '1e'

tape(
  'POST /forms/{digest}/subscribers > annotation notification',
  function (test) {
    server(function (port, done) {
      mailgun.events.once('message', function (message) {
        test.equal(message.to, email, 'to')
        mailgun.events.removeAllListeners()
        done()
        test.end()
      })
      series(
        [
          postForm(port, publisher, password, form, test),
          subscribeToForm(port, publisher, password, test, digest),
          postAnnotation(publisher, password, port, annotation, test)
        ],
        function () { /* pass */ }
      )
    })
  }
)

tape(
  'POST /forms/{digest}/subscribers > published notification',
  function (test) {
    server(function (port, done) {
      mailgun.events.once('message', function (message) {
        test.equal(message.to, email, 'to')
        mailgun.events.removeAllListeners()
        done()
        test.end()
      })
      series(
        [
          postForm(port, publisher, password, form, test),
          subscribeToForm(port, publisher, password, test, digest),
          postProject(
            publisher, password, port,
            project, edition,
            digest, false, false,
            test
          )
        ],
        function () { /* pass */ }
      )
    })
  }
)

tape('DELETE /forms/{digest}/subscribers', function (test) {
  server(function (port, closeServer) {
    mailgun.events.once('message', function () {
      test.fail('sent notification')
    })
    series(
      [
        postForm(port, publisher, password, form, test),
        subscribeToForm(port, publisher, password, test, digest),
        unsubscribeFromForm(port, publisher, password, test, digest),
        postAnnotation(publisher, password, port, annotation, test)
      ],
      function () {
        setTimeout(function () {
          mailgun.events.removeAllListeners()
          test.end()
          closeServer()
        }, 500)
      }
    )
  })
})

tape(
  'GET /forms/{digest}/subscribers/{subscriber}',
  function (test) {
    var subscriptionPath = (
      '/forms/' + digest +
      '/subscribers/' + publisher
    )
    server(function (port, closeServer) {
      series(
        [
          postForm(port, publisher, password, form, test),
          subscribeToForm(port, publisher, password, test, digest),
          function (done) {
            var options = {
              port: port,
              path: subscriptionPath,
              auth: publisher + ':' + password
            }
            http.request(options, function (response) {
              test.equal(response.statusCode, 200, '200 as subscriber')
              done()
            })
              .end()
          },
          function (done) {
            var options = {
              port: port,
              path: subscriptionPath,
              auth: 'bob:bob\'s password'
            }
            http.request(options, function (response) {
              test.equal(
                response.statusCode, 403,
                '403 as other publisher'
              )
              done()
            })
              .end()
          }
        ],
        function () {
          closeServer()
          test.end()
        }
      )
    })
  }
)

tape(
  'GET /forms/{digest}/subscribers/{not-subscribed}',
  function (test) {
    var subscriptionPath = (
      '/forms/' + digest +
      '/subscribers/' + publisher
    )
    server(function (port, closeServer) {
      series(
        [
          postForm(port, publisher, password, form, test),
          function (done) {
            var options = {
              port: port,
              path: subscriptionPath,
              auth: publisher + ':' + password
            }
            http.request(options, function (response) {
              test.equal(response.statusCode, 404, '404 as subscriber')
              done()
            })
              .end()
          },
          function (done) {
            var options = {
              port: port,
              path: subscriptionPath,
              auth: 'bob:bob\'s password'
            }
            http.request(options, function (response) {
              test.equal(
                response.statusCode, 403,
                '403 as other publisher'
              )
              done()
            })
              .end()
          }
        ],
        function () {
          closeServer()
          test.end()
        }
      )
    })
  }
)

tape(
  'PATCH /forms/{digest}/subscribers/{subscriber}',
  function (test) {
    var subscriptionPath = (
      '/forms/' + digest +
      '/subscribers/' + publisher
    )
    server(function (port, closeServer) {
      series(
        [
          postForm(port, publisher, password, form, test),
          subscribeToForm(port, publisher, password, test, digest),
          function (done) {
            var options = {
              method: 'PATCH',
              port: port,
              path: subscriptionPath,
              auth: publisher + ':' + password
            }
            http.request(options, function (response) {
              test.equal(response.statusCode, 405, '405')
              done()
            })
              .end()
          }
        ],
        function () {
          closeServer()
          test.end()
        }
      )
    })
  }
)

tape(
  'POST /publishers/{publisher}' +
  '/projects/{project}' +
  '/publications/{subscriber}' +
  '/subscribers',
  function (test) {
    server(function (port, closeServer) {
      mailgun.events.once('message', function (message) {
        test.equal(message.to, email, 'to')
        mailgun.events.removeAllListeners()
        closeServer()
        test.end()
      })
      series(
        [
          postForm(port, publisher, password, form, test),
          postProject(
            publisher, password, port,
            project, edition,
            digest, false, false,
            test
          ),
          subscribeToEdition(
            port, publisher, password, test, publisher, project, edition
          ),
          postAnnotation(
            publisher, password, port, annotation, test
          )
        ],
        function () { /* pass */ }
      )
    })
  }
)

tape(
  'DELETE /publishers/{publisher}' +
  '/projects/{project}' +
  '/publications/{subscriber}' +
  '/subscribers',
  function (test) {
    server(function (port, closeServer) {
      mailgun.events.once('message', function () {
        test.fail('sent notification')
      })
      series(
        [
          postForm(port, publisher, password, form, test),
          postProject(
            publisher, password, port,
            project, edition,
            digest, false, false,
            test
          ),
          subscribeToEdition(
            port, publisher, password, test, publisher, project, edition
          ),
          unsubscribeFromEdition(
            port, publisher, password, test, publisher, project, edition
          ),
          postAnnotation(
            publisher, password, port, annotation, test
          )
        ],
        function () {
          setTimeout(function () {
            mailgun.events.removeAllListeners()
            test.end()
            closeServer()
          }, 500)
        }
      )
    })
  }
)

tape(
  'POST /publishers/{publisher}' +
  '/projects/{project}' +
  '/subscribers/{subscriber}',
  function (test) {
    server(function (port, closeServer) {
      mailgun.events.once('message', function (message) {
        test.equal(message.to, email, 'to')
        mailgun.events.removeAllListeners()
        closeServer()
        test.end()
      })
      series(
        [
          postForm(port, publisher, password, form, test),
          postProject(
            publisher, password, port,
            project, edition,
            digest, false, false,
            test
          ),
          subscribeToProject(
            port, publisher, password, test, publisher, project
          ),
          postProject(
            publisher, password, port,
            project, '2e',
            digest, false, false,
            test
          )
        ],
        function () { /* pass */ }
      )
    })
  }
)

tape(
  'DELETE /publishers/{publisher}' +
  '/projects/{project}' +
  '/subscribers/{subscriber}',
  function (test) {
    server(function (port, closeServer) {
      mailgun.events.once('message', function () {
        test.fail('sent notification')
      })
      series(
        [
          postForm(port, publisher, password, form, test),
          postProject(
            publisher, password, port,
            project, edition,
            digest, false, false,
            test
          ),
          subscribeToProject(
            port, publisher, password, test, publisher, project
          ),
          unsubscribeFromProject(
            port, publisher, password, test, publisher, project
          ),
          postProject(
            publisher, password, port,
            project, '2e',
            digest, false, false,
            test
          )
        ],
        function () {
          setTimeout(function () {
            mailgun.events.removeAllListeners()
            test.end()
            closeServer()
          }, 500)
        }
      )
    })
  }
)

tape(
  'POST /publishers/{publisher}/subscribers/{subscriber}',
  function (test) {
    server(function (port, closeServer) {
      mailgun.events.once('message', function (message) {
        test.equal(message.to, email, 'to')
        mailgun.events.removeAllListeners()
        closeServer()
        test.end()
      })
      series(
        [
          postForm(port, publisher, password, form, test),
          subscribeToPublisher(
            port, publisher, password, test, publisher
          ),
          postProject(
            publisher, password, port,
            project, edition,
            digest, false, false,
            test
          )
        ],
        function () { /* pass */ }
      )
    })
  }
)

tape(
  'DELETE /publishers/{publisher}/subscribers/{subscriber}',
  function (test) {
    server(function (port, closeServer) {
      mailgun.events.once('message', function () {
        test.fail('sent notification')
      })
      series(
        [
          postForm(port, publisher, password, form, test),
          subscribeToPublisher(
            port, publisher, password, test, publisher
          ),
          unsubscribeFromPublisher(
            port, publisher, password, test, publisher
          ),
          postProject(
            publisher, password, port,
            project, edition,
            digest, false, false,
            test
          )
        ],
        function () {
          setTimeout(function () {
            mailgun.events.removeAllListeners()
            test.end()
            closeServer()
          }, 500)
        }
      )
    })
  }
)

tape(
  'POST /annotations/{uuid}/subscribers/{subscriber}',
  function (test) {
    var uuid
    var reply = JSON.parse(JSON.stringify(annotation))
    server(function (port, closeServer) {
      mailgun.events.once('message', function (message) {
        test.equal(message.to, email, 'to')
        mailgun.events.removeAllListeners()
        closeServer()
        test.end()
      })
      series(
        [
          postForm(port, publisher, password, form, test),
          function annotate (done) {
            postAnnotation(
              publisher, password, port, annotation, test
            )(withLocation)
            function withLocation (error, location) {
              test.ifError(error)
              uuid = location.replace('/annotations/', '')
              reply.replyTo = [uuid]
              done()
            }
          },
          subscribeToAnnotation(
            port, publisher, password, test,
            function () {
              return uuid
            }
          ),
          function postReply (done) {
            var reply = JSON.parse(JSON.stringify(annotation))
            reply.replyTo = [uuid]
            postAnnotation(publisher, password, port, reply, test)(done)
          }
        ],
        function () { /* pass */ }
      )
    })
  }
)

tape(
  'DELETE /annotation/{uuid}/subscribers/{publisher}',
  function (test) {
    var uuid
    var reply = JSON.parse(JSON.stringify(annotation))
    server(function (port, closeServer) {
      mailgun.events.once('message', function () {
        test.fail('sent notification')
      })
      series(
        [
          postForm(port, publisher, password, form, test),
          function annotate (done) {
            postAnnotation(
              publisher, password, port, annotation, test
            )(withLocation)
            function withLocation (error, location) {
              test.ifError(error)
              uuid = location.replace('/annotations/', '')
              reply.replyTo = [uuid]
              done()
            }
          },
          subscribeToAnnotation(
            port, publisher, password, test,
            function () {
              return uuid
            }
          ),
          unsubscribeFromAnnotation(
            port, publisher, password, test,
            function () {
              return uuid
            }
          ),
          function postReply (done) {
            postAnnotation(publisher, password, port, reply, test)(done)
          }
        ],
        function () {
          setTimeout(function () {
            mailgun.events.removeAllListeners()
            test.end()
            closeServer()
          }, 500)
        }
      )
    })
  }
)
