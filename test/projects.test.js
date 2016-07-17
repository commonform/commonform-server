var concat = require('concat-stream')
var http = require('http')
var normalize = require('commonform-normalize')
var postForm = require('./post-form')
var postProject = require('./post-project')
var series = require('async-series')
var server = require('./server')
var tape = require('tape')

var PUBLISHER = 'ana'
var PASSWORD = 'ana\'s password'

tape('POST /publishers/$publisher/projects/$project/publications/$edition', function (test) {
  var project = 'nda'
  var edition = '1e'
  var form = {content: ['A test form']}
  var digest = normalize(form).root
  var path = (
    '/publishers/' + PUBLISHER +
    '/projects/' + project +
    '/publications/' + edition
  )
  server(function (port, done) {
    var request = {
      auth: PUBLISHER + ':' + PASSWORD,
      method: 'POST',
      port: port,
      path: path
    }
    series(
      [
        postForm(port, form, test),
        function putProject (done) {
          http.request(request, function (response) {
            test.equal(response.statusCode, 204, '204')
            test.equal(response.headers.location, path, 'Location')
            done()
          }).end(JSON.stringify({digest: digest}))
        }
      ],
      function () {
        done()
        test.end()
      }
    )
  })
})

tape('POST /publishers/$other-publisher/projects/$project/publications/$edition', function (test) {
  var otherPublisher = 'bob'
  var project = 'nda'
  var edition = '1e'
  var digest = 'a'.repeat(64)
  var path = (
    '/publishers/' + otherPublisher +
    '/projects/' + project +
    '/publications/' + edition
  )
  server(function (port, done) {
    var options = {
      auth: PUBLISHER + ':' + PASSWORD,
      method: 'POST',
      port: port,
      path: path
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 403, '403')
      done()
      test.end()
    }).end(JSON.stringify({digest: digest}))
  })
})

tape('POST /publishers/$other-publisher/projects/$project/publications/$edition', function (test) {
  var otherPublisher = 'bob'
  var project = 'nda'
  var edition = '1e'
  var digest = 'a'.repeat(64)
  var path = (
    '/publishers/' + otherPublisher +
    '/projects/' + project +
    '/publications/' + edition
  )
  server(function (port, done) {
    var options = {
      auth: PUBLISHER + ':' + PASSWORD,
      method: 'POST',
      port: port,
      path: path
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 403, '403')
      done()
      test.end()
    }).end(JSON.stringify({digest: digest}))
  })
})

tape('POST /publishers/publisher/projects/$project/publications/$edition for unknown publisher', function (test) {
  var publisher = 'charlie'
  var password = 'charlie\'s password'
  var project = 'nda'
  var edition = '1e'
  var digest = 'a'.repeat(64)
  var path = (
    '/publishers/' + publisher +
    '/projects/' + project +
    '/publications/' + edition
  )
  server(function (port, done) {
    var options = {
      auth: publisher + ':' + password,
      method: 'POST',
      port: port,
      path: path
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 401, '401')
      done()
      test.end()
    }).end(JSON.stringify({digest: digest}))
  })
})

tape('POST /publishers/$publisher/projects/$project/publications/$edition with bad body', function (test) {
  var project = 'nda'
  var edition = '1e'
  var path = (
    '/publishers/' + PUBLISHER +
    '/projects/' + project +
    '/publications/' + edition
  )
  server(function (port, done) {
    var options = {
      auth: PUBLISHER + ':' + PASSWORD,
      method: 'POST',
      port: port,
      path: path
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 400, '400')
      response.pipe(concat(function (buffer) {
        test.equal(buffer.toString(), 'invalid project', 'invalid project')
        done()
        test.end()
      }))
    }).end(JSON.stringify({}))
  })
})

tape('POST /publishers/$publisher/projects/$invalid-project/publications/$edition', function (test) {
  test.plan(2)
  var publisher = 'ana'
  var password = 'ana\'s password'
  var project = 'no_underscores_allowed'
  var edition = '1e'
  var digest = 'a'.repeat(64)
  var path = (
    '/publishers/' + publisher +
    '/projects/' + project +
    '/publications/' + edition
  )
  server(function (port, done) {
    var options = {
      auth: publisher + ':' + password,
      method: 'POST',
      port: port,
      path: path
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 400, '400')
      response.pipe(concat(function (buffer) {
        test.equal(buffer.toString(), 'invalid project name', 'invalid name')
        done()
        test.end()
      }))
    }).end(JSON.stringify({digest: digest}))
  })
})

tape('POST /publishers/$publisher/projects/$project/publications/$edition with missing form', function (test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var project = 'nda'
  var edition = '1e'
  var digest = 'a'.repeat(64)
  var path = (
    '/publishers/' + publisher +
    '/projects/' + project +
    '/publications/' + edition
  )
  server(function (port, done) {
    var options = {
      auth: publisher + ':' + password,
      method: 'POST',
      port: port,
      path: path
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 400, '400')
      response.pipe(concat(function (buffer) {
        test.equal(buffer.toString(), 'unknown form', 'unknown form')
        done()
        test.end()
      }))
    }).end(JSON.stringify({digest: digest}))
  })
})

tape('POST /publishers/$publisher/projects/$project/publications/$invalid-edition', function (test) {
  var project = 'da'
  var edition = '1.0.0'
  var digest = 'a'.repeat(64)
  var path = (
    '/publishers/' + PUBLISHER +
    '/projects/' + project +
    '/publications/' + edition
  )
  server(function (port, done) {
    var options = {
      auth: PUBLISHER + ':' + PASSWORD,
      method: 'POST',
      port: port,
      path: path
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 400, '400')
      response.pipe(concat(function (buffer) {
        test.equal(buffer.toString(), 'invalid edition', 'invalid edition')
        done()
        test.end()
      }))
    }).end(JSON.stringify({digest: digest}))
  })
})

tape('POST /publishers/$publisher/projects/$project/publications/$edition with invalid digest', function (test) {
  var project = 'da'
  var edition = '1e'
  var digest = 'blah'
  var path = (
    '/publishers/' + PUBLISHER +
    '/projects/' + project +
    '/publications/' + edition
  )
  server(function (port, done) {
    var options = {
      auth: PUBLISHER + ':' + PASSWORD,
      method: 'POST',
      port: port,
      path: path
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 400, '400')
      response.pipe(concat(function (buffer) {
        test.equal(buffer.toString(), 'invalid digest', 'invalid digest')
        done()
        test.end()
      }))
    }).end(JSON.stringify({digest: digest}))
  })
})

tape('POST /publishers/$publisher/projects/$project/publications/$edition with invalid JSON', function (test) {
  var project = 'nda'
  var edition = '1e'
  var digest = 'a'.repeat(64)
  var path = (
    '/publishers/' + PUBLISHER +
    '/projects/' + project +
    '/publications/' + edition
  )
  server(function (port, done) {
    var options = {
      auth: PUBLISHER + ':' + PASSWORD,
      method: 'POST',
      port: port,
      path: path
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 400, '400')
      response.pipe(concat(function (buffer) {
        test.equal(buffer.toString(), 'invalid JSON', 'invalid JSON')
        done()
        test.end()
      }))
    }).end('The form is ' + digest)
  })
})

tape('POST /publishers/$publisher/projects/$project/publications/$edition as other publisher', function (test) {
  var project = 'nda'
  var edition = '1e'
  var digest = 'a'.repeat(64)
  var path = (
    '/publishers/' + 'bob' +
    '/projects/' + project +
    '/publications/' + edition
  )
  server(function (port, done) {
    var options = {
      auth: PUBLISHER + ':' + PASSWORD,
      method: 'POST',
      port: port,
      path: path
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 403, '403')
      done()
      test.end()
    }).end(JSON.stringify({digest: digest}))
  })
})

tape('POST /publishers/$publisher/projects/$project/publications/$edition with bad password', function (test) {
  var badPassword = 'not ana\'s password'
  var project = 'nda'
  var edition = '1e'
  var digest = 'a'.repeat(64)
  var path = (
    '/publishers/' + PUBLISHER +
    '/projects/' + project +
    '/publications/' + edition
  )
  server(function (port, done) {
    var options = {
      auth: PUBLISHER + ':' + badPassword,
      method: 'POST',
      port: port,
      path: path
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 401, '401')
      done()
      test.end()
    }).end(JSON.stringify({digest: digest}))
  })
})

tape('POST /publishers/$publisher/projects/$project/publications/$existing', function (test) {
  var project = 'nda'
  var edition = '1e'
  var form = {content: ['A test form']}
  var digest = normalize(form).root
  var path = (
    '/publishers/' + PUBLISHER +
    '/projects/' + project +
    '/publications/' + edition
  )
  server(function (port, done) {
    var request = {
      auth: PUBLISHER + ':' + PASSWORD,
      method: 'POST',
      port: port,
      path: path
    }
    series(
      [
        postForm(port, form, test),
        postProject(PUBLISHER, PASSWORD, port, project, edition, digest, test),
        function putProjectAgain (done) {
          setTimeout(function () {
            http.request(request, function (response) {
              test.equal(response.statusCode, 409, 'Second POST 409')
              done()
            }).end(JSON.stringify({digest: digest}))
          }, 1000)
        }
      ],
      function finish () {
        done()
        test.end()
      }
    )
  })
})

tape('GET /publishers/$publisher/projects/$project/publications/$nonexistent', function (test) {
  var PUBLISHER = 'ana'
  var project = 'nda'
  var edition = '1e'
  server(function (port, done) {
    var options = {
      method: 'GET',
      port: port,
      path: (
        '/publishers/' + PUBLISHER +
        '/projects/' + project +
        '/publications/' + edition
      )
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 404, '404')
      done()
      test.end()
    }).end()
  })
})

tape('GET /publishers/$publisher/projects/$project/publications/$existing', function (test) {
  var project = 'nda'
  var edition = '1e'
  var form = {content: ['A test form']}
  var digest = normalize(form).root
  var path = (
    '/publishers/' + PUBLISHER +
    '/projects/' + project +
    '/publications/' + edition
  )
  server(function (port, done) {
    series(
      [
        postForm(port, form, test),
        postProject(PUBLISHER, PASSWORD, port, project, edition, digest, test),
        function getProject (done) {
          var options = {method: 'GET', port: port, path: path}
          http.request(options, function (response) {
            test.equal(response.statusCode, 200, 'GET 200')
            response.pipe(concat(function (buffer) {
              var responseBody = JSON.parse(buffer)
              test.equal(
                responseBody.digest, digest,
                'GET project JSON'
              )
              done()
            }))
          }).end()
        }
      ],
      function finish () {
        done()
        test.end()
      }
    )
  })
})

tape('GET /publishers/$publisher/projects', function (test) {
  var project = 'nda'
  var edition = '1e'
  var form = {content: ['A test form']}
  var digest = normalize(form).root
  server(function (port, done) {
    series(
      [
        postForm(port, form, test),
        postProject(PUBLISHER, PASSWORD, port, project, edition, digest, test),
        function getProject (done) {
          var options = {port: port, path: '/publishers/' + PUBLISHER + '/projects'}
          http.request(options, function (response) {
            response.pipe(concat(function (buffer) {
              var responseBody = JSON.parse(buffer)
              test.deepEqual(
                responseBody, [project],
                'GET projects JSON'
              )
              done()
            }))
          }).end()
        }
      ],
      function finish () {
        done()
        test.end()
      }
    )
  })
})

tape('GET /publishers/$publisher/projects/$project/publications/current', function (test) {
  var project = 'nda'
  var edition = '2e'
  var form = {content: ['A test form']}
  var digest = normalize(form).root
  server(function (port, done) {
    series(
      [
        postForm(port, form, test),
        postProject(PUBLISHER, PASSWORD, port, project, edition, digest, test),
        function getProject (done) {
          var options = {
            port: port,
            path: (
              '/publishers/' + PUBLISHER +
              '/projects/' + project +
              '/publications/current'
            )
          }
          http.get(options, function (response) {
            response.pipe(concat(function (buffer) {
              var responseBody = JSON.parse(buffer)
              test.equal(responseBody.digest, digest, 'GET project JSON')
              done()
            }))
          }).end()
        }
      ],
      function finish () {
        done()
        test.end()
      }
    )
  })
})

tape('GET /publishers/$publisher/projects/$project/publications/latest', function (test) {
  var project = 'nda'
  var edition = '2e'
  var form = {content: ['A test form']}
  var digest = normalize(form).root
  server(function (port, done) {
    series(
      [
        postForm(port, form, test),
        postProject(PUBLISHER, PASSWORD, port, project, edition, digest, test),
        function getProject (done) {
          var options = {
            method: 'GET',
            port: port,
            path: (
              '/publishers/' + PUBLISHER +
              '/projects/' + project +
              '/publications/latest'
            )
          }
          http.request(options, function (response) {
            response.pipe(concat(function (buffer) {
              var responseBody = JSON.parse(buffer)
              test.equal(responseBody.digest, digest, 'GET project JSON')
              done()
            }))
          }).end()
        }
      ],
      function finish () {
        done()
        test.end()
      }
    )
  })
})

tape('GET /publishers/$publisher/projects/$project/publications/$existing/form', function (test) {
  var project = 'nda'
  var edition = '1e'
  var form = {content: ['A test form']}
  var digest = normalize(form).root
  server(function (port, done) {
    series(
      [
        postForm(port, form, test),
        postProject(PUBLISHER, PASSWORD, port, project, edition, digest, test),
        function getProject (done) {
          var options = {
            method: 'GET',
            port: port,
            path: (
              '/publishers/' + PUBLISHER +
              '/projects/' + project +
              '/publications/' + edition +
              '/form'
            )
          }
          http.request(options, function (response) {
            test.equal(response.statusCode, 301, 'GET 301')
            test.equal(
              response.headers.location, '/forms/' + digest,
              'Location /forms/...'
            )
            done()
          }).end()
        }
      ],
      function finish () {
        done()
        test.end()
      }
    )
  })
})

tape('GET /publishers/$publisher/projects/$project/publications/current/form', function (test) {
  var project = 'nda'
  var edition = '1e'
  var form = {content: ['A test form']}
  var digest = normalize(form).root
  server(function (port, done) {
    series(
      [
        postForm(port, form, test),
        postProject(PUBLISHER, PASSWORD, port, project, edition, digest, test),
        function getProject (done) {
          var options = {
            method: 'GET',
            port: port,
            path: (
              '/publishers/' + PUBLISHER +
              '/projects/' + project +
              '/publications/current/form'
            )
          }
          http.request(options, function (response) {
            test.equal(response.statusCode, 301, 'GET 301')
            test.equal(
              response.headers.location, '/forms/' + digest,
              'Location /forms/...'
            )
            done()
          }).end()
        }
      ],
      function finish () {
        done()
        test.end()
      }
    )
  })
})

tape('GET /publishers/$publisher/projects/$project/publications/latest/form', function (test) {
  var project = 'nda'
  var edition = '1e'
  var form = {content: ['A test form']}
  var digest = normalize(form).root
  server(function (port, done) {
    series(
      [
        postForm(port, form, test),
        postProject(PUBLISHER, PASSWORD, port, project, edition, digest, test),
        function getProject (done) {
          var options = {
            method: 'GET',
            port: port,
            path: (
              '/publishers/' + PUBLISHER +
              '/projects/' + project +
              '/publications/latest/form'
            )
          }
          http.request(options, function (response) {
            test.equal(response.statusCode, 301, 'GET 301')
            test.equal(
              response.headers.location, '/forms/' + digest,
              'Location /forms/...'
            )
            done()
          }).end()
        }
      ],
      function finish () {
        done()
        test.end()
      }
    )
  })
})

tape('PUT /publishers/$publisher/projects/$project/publications/$edition', function (test) {
  var edition = '1e'
  var project = 'nda'
  server(function (port, done) {
    var options = {
      method: 'PUT',
      port: port,
      path: (
        '/publishers/' + PUBLISHER +
        '/projects/' + project +
        '/publications/' + edition
      )
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 405, '405')
      done()
      test.end()
    }).end()
  })
})

tape('PUT /publishers/$publisher/projects/$project/publications/$edition/form', function (test) {
  var PUBLISHER = 'ana'
  var project = 'nda'
  var edition = '1e'
  server(function (port, done) {
    var options = {
      method: 'PUT',
      port: port,
      path: (
        '/publishers/' + PUBLISHER +
        '/projects/' + project +
        '/publications/' + edition +
        '/form'
      )
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 405, '405')
      done()
      test.end()
    }).end()
  })
})

tape('GET /forms/$form/publications', function (test) {
  var form = {content: ['A test form']}
  var digest = normalize(form).root
  var otherForm = {content: ['Another test form']}
  var otherDigest = normalize(otherForm).root
  server(function (port, done) {
    series(
      [
        postForm(port, form, test),
        postForm(port, otherForm, test),
        postProject('ana', 'ana\'s password', port, 'wrong', '1e', otherDigest, test),
        postProject('ana', 'ana\'s password', port, 'nda', '1e1d', digest, test),
        postProject('ana', 'ana\'s password', port, 'nda', '1e', digest, test),
        postProject('ana', 'ana\'s password', port, 'nondisclosure', '1e', digest, test),
        postProject('bob', 'bob\'s password', port, 'conf', '3e', digest, test),
        function getPublications (done) {
          var options = {
            port: port,
            path: '/forms/' + digest + '/publications'
          }
          http.request(options, function (response) {
            response.pipe(concat(function (buffer) {
              var responseBody = JSON.parse(buffer)
              test.same(
                responseBody,
                [
                  {
                    publisher: 'ana',
                    project: 'nda',
                    edition: '1e1d',
                    root: true, digest: digest
                  },
                  {
                    publisher: 'ana',
                    project: 'nda',
                    edition: '1e',
                    root: true, digest: digest
                  },
                  {
                    publisher: 'ana',
                    project: 'nondisclosure',
                    edition: '1e',
                    root: true,
                    digest: digest
                  },
                  {
                    publisher: 'bob',
                    project: 'conf',
                    edition: '3e',
                    root: true,
                    digest: digest
                  }
                ],
                'GET publications JSON'
              )
              done()
            }))
          }).end()
        }
      ],
      function finish () {
        done()
        test.end()
      }
    )
  })
})

tape('GET /forms/$form/publications for a child form', function (test) {
  var project = 'nda'
  var edition = '1e'
  var child = {content: ['A test form']}
  var parent = {content: [{form: child}]}
  var parentDigest = normalize(parent).root
  var childDigest = normalize(child).root
  server(function (port, done) {
    series(
      [
        postForm(port, parent, test),
        postProject(PUBLISHER, PASSWORD, port, project, edition, parentDigest, test),
        function getPublications (done) {
          var options = {
            port: port,
            path: '/forms/' + childDigest + '/publications'
          }
          http.request(options, function (response) {
            response.pipe(concat(function (buffer) {
              var responseBody = JSON.parse(buffer)
              test.same(
                responseBody,
                [
                  {
                    publisher: PUBLISHER,
                    project: project,
                    edition: edition,
                    root: false,
                    digest: childDigest
                  }
                ],
                'GET publications JSON'
              )
              done()
            }))
          }).end()
        }
      ],
      function finish () {
        done()
        test.end()
      }
    )
  })
})
