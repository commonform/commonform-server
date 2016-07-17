var concat = require('./concat')
var http = require('http')
var normalize = require('commonform-normalize')
var postForm = require('./post-form')
var postProject = require('./post-project')
var series = require('async-series')
var server = require('./server')
var tape = require('tape')

tape('POST /publishers/:name without credentials', function (test) {
  var body = {
    email: 'charlie@example.com',
    about: '',
    password: 'evil mastdon hoary cup'
  }
  server(function (port, done) {
    var options = {
      method: 'POST',
      port: port,
      path: '/publishers/charlie'
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 401, 'POST 401')
      done()
      test.end()
    }).end(JSON.stringify(body))
  })
})

tape('POST /publishers/:name with bad credentials', function (test) {
  var body = {
    email: 'charlie@example.com',
    about: '',
    password: 'evil mastdon hoary cup'
  }
  var user = 'administrator'
  var password = 'incorrect password'
  server(function (port, done) {
    var options = {
      auth: user + ':' + password,
      method: 'POST',
      port: port,
      path: '/publishers/charlie'
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 401, 'POST 401')
      done()
      test.end()
    }).end(JSON.stringify(body))
  })
})

tape('POST /publishers/:name with password', function (test) {
  var body = {
    email: 'charlie@example.com',
    about: '',
    password: 'evil mastdon hoary cup'
  }
  var user = 'administrator'
  var password = process.env.ADMINISTRATOR_PASSWORD
  server(function (port, done) {
    var options = {
      auth: user + ':' + password,
      method: 'POST',
      port: port,
      path: '/publishers/charlie'
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 204, 'POST 204')
      test.equal(
        response.headers.location, '/publishers/charlie',
        'Location'
      )
      done()
      test.end()
    }).end(JSON.stringify(body))
  })
})

tape('POST /publishers/:name with null', function (test) {
  var user = 'administrator'
  var password = process.env.ADMINISTRATOR_PASSWORD
  server(function (port, done) {
    var options = {
      auth: user + ':' + password,
      method: 'POST',
      port: port,
      path: '/publishers/charlie'
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 400, 'POST 400')
      done()
      test.end()
    }).end('null')
  })
})

tape('GET /publishers/:name for existing', function (test) {
  var body = {
    email: 'charlie@example.com',
    about: 'A test publisher',
    password: 'evil mastdon hoary cup'
  }
  var user = 'administrator'
  var password = process.env.ADMINISTRATOR_PASSWORD
  server(function (port, done) {
    var options = {
      auth: user + ':' + password,
      method: 'POST',
      port: port,
      path: '/publishers/charlie'
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 204, 'POST 204')
      var location = response.headers.location
      test.equal(
        location, '/publishers/charlie',
        'Location'
      )
      var options = {port: port, path: location}
      http.request(options, function (response) {
        test.equal(response.statusCode, 200, 'GET 200')
        concat(test, response, function (body) {
          test.equal(
            body.publisher, 'charlie',
            'serves name'
          )
          test.equal(
            body.about, body.about,
            'serves about'
          )
          test.assert(
            !body.hasOwnProperty('email'),
            'does not serve e-mail'
          )
          test.assert(
            !body.hasOwnProperty('password'),
            'does not serve password'
          )
          done()
          test.end()
        })
      }).end()
    }).end(JSON.stringify(body))
  })
})

tape('GET /publishers/:name for nonexistent', function (test) {
  server(function (port, done) {
    var options = {port: port, path: '/publishers/david'}
    http.request(options, function (response) {
      test.equal(response.statusCode, 404, 'GET 404')
      done()
      test.end()
    }).end()
  })
})

tape('DELETE /publishers/:name', function (test) {
  server(function (port, done) {
    var options = {
      method: 'DELETE',
      port: port,
      path: '/publishers/charlie'
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 405, 'DELETE 405')
      done()
      test.end()
    }).end()
  })
})

tape('GET /publishers/:name nonexistent', function (test) {
  server(function (port, done) {
    var options = {port: port, path: '/publishers/charlie'}
    http.request(options, function (response) {
      test.equal(response.statusCode, 404, 'GET 404')
      done()
      test.end()
    }).end()
  })
})

tape('POST /publishers/:name for existing', function (test) {
  var body = {
    email: 'ana@example.com',
    about: '',
    password: 'evil mastdon hoary cup'
  }
  var user = 'administrator'
  var password = process.env.ADMINISTRATOR_PASSWORD
  server(function (port, done) {
    var options = {
      auth: user + ':' + password,
      method: 'POST',
      port: port,
      path: '/publishers/ana'
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 409, 'POST 409')
      done()
      test.end()
    }).end(JSON.stringify(body))
  })
})

tape('PUT /publishers/:name to update', function (test) {
  var user = 'ana'
  var password = 'ana\'s password'
  var newPassword = 'evil mastodon hoary cup'
  var body = {
    email: 'different@example.com',
    about: 'Ana the test publisher',
    password: newPassword
  }
  var form = {content: ['Just a test form']}
  var digest = normalize(form).root
  server(function (port, done) {
    series(
      [
        postForm(port, form, test),
        // Change password.
        function (done) {
          var options = {
            auth: user + ':' + password,
            method: 'PUT',
            port: port,
            path: '/publishers/ana'
          }
          http.request(options, function (response) {
            test.equal(response.statusCode, 204, 'PUT 204')
            done()
          }).end(JSON.stringify(body))
        },
        // Use updated password to post a project.
        postProject('ana', newPassword, port, 'y', '1e', digest, test)
      ],
      function () {
        done()
        test.end()
      }
    )
  })
})

tape('PUT /publishers/:name by another publisher', function (test) {
  var user = 'bob'
  var password = 'bob\'s password'
  var body = {
    email: 'different@example.com',
    about: 'Ana the test publisher',
    password: 'evil mastdon hoary cup'
  }
  server(function (port, done) {
    var options = {
      auth: user + ':' + password,
      method: 'PUT',
      port: port,
      path: '/publishers/ana'
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 403, 'PUT 403')
      done()
      test.end()
    }).end(JSON.stringify(body))
  })
})

tape('PUT /publishers/:nonexistent', function (test) {
  var user = 'administrator'
  var password = process.env.ADMINISTRATOR_PASSWORD
  var body = {
    email: 'charlie@example.com',
    about: 'Charlie the test publisher',
    password: 'evil mastdon hoary cup'
  }
  server(function (port, done) {
    var options = {
      auth: user + ':' + password,
      method: 'PUT',
      port: port,
      path: '/publishers/charlie'
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 404, 'PUT 404')
      done()
      test.end()
    }).end(JSON.stringify(body))
  })
})

tape('PUT /publishers/:name with bad body', function (test) {
  var user = 'administrator'
  var password = process.env.ADMINISTRATOR_PASSWORD
  var body = {invalid: 'nonsense'}
  server(function (port, done) {
    var options = {
      auth: user + ':' + password,
      method: 'PUT',
      port: port,
      path: '/publishers/ana'
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 400, 'PUT 400')
      done()
      test.end()
    }).end(JSON.stringify(body))
  })
})

tape('PUT /publishers/:name with weak password', function (test) {
  var user = 'administrator'
  var password = process.env.ADMINISTRATOR_PASSWORD
  var body = {
    email: 'charlie@example.com',
    about: 'Charlie the test publisher',
    password: '1234'
  }
  server(function (port, done) {
    var options = {
      auth: user + ':' + password,
      method: 'PUT',
      port: port,
      path: '/publishers/ana'
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 400, 'PUT 400')
      var buffer = []
      response
      .on('data', function (chunk) { buffer.push(chunk) })
      .once('end', function () {
        test.same(
          Buffer.concat(buffer).toString(),
          'invalid password',
          'serves "invalid password"'
        )
        done()
        test.end()
      })
    }).end(JSON.stringify(body))
  })
})

tape('POST /publishers/:name with bad Authorization', function (test) {
  var body = {
    email: 'charlie@example.com',
    about: '',
    password: 'evil mastdon hoary cup'
  }
  server(function (port, done) {
    var options = {
      method: 'POST',
      port: port,
      path: '/publishers/charlie',
      headers: {Authorization: 'blah'}
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 401, 'POST 401')
      done()
      test.end()
    }).end(JSON.stringify(body))
  })
})

tape('PUT /publishers/:name with bad Authorization', function (test) {
  var body = {
    email: 'ana@example.com',
    about: 'More about',
    password: 'evil mastdon hoary cup'
  }
  server(function (port, done) {
    var options = {
      method: 'PUT',
      port: port,
      path: '/publishers/ana',
      headers: {Authorization: 'blah'}
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 401, 'POST 401')
      done()
      test.end()
    }).end(JSON.stringify(body))
  })
})

tape('POST /publishers/:name without password', function (test) {
  var body = {email: 'charlie@example.com', about: ''}
  var user = 'administrator'
  var password = process.env.ADMINISTRATOR_PASSWORD
  server(function (port, done) {
    var options = {
      auth: user + ':' + password,
      method: 'POST',
      port: port,
      path: '/publishers/charlie'
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 400, 'POST 400')
      var buffer = []
      response
      .on('data', function (chunk) { buffer.push(chunk) })
      .once('end', function () {
        test.equal(
          Buffer.concat(buffer).toString(), 'invalid publisher',
          'responds "invalid publisher"'
        )
        done()
        test.end()
      })
    }).end(JSON.stringify(body))
  })
})

tape('POST /publishers/:name without e-mail', function (test) {
  var body = {password: 'evil mastdon hoary cup', about: ''}
  var user = 'administrator'
  var password = process.env.ADMINISTRATOR_PASSWORD
  server(function (port, done) {
    var options = {
      auth: user + ':' + password,
      method: 'POST',
      port: port,
      path: '/publishers/charlie'
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 400, 'POST 400')
      var buffer = []
      response
      .on('data', function (chunk) { buffer.push(chunk) })
      .once('end', function () {
        test.equal(
          Buffer.concat(buffer).toString(), 'invalid publisher',
          'responds "invalid publisher"'
        )
        done()
        test.end()
      })
    }).end(JSON.stringify(body))
  })
})

tape('POST /publishers/:name with bad e-mail', function (test) {
  var body = {
    email: 'charlie',
    about: '',
    password: 'evil mastdon hoary cup'
  }
  var user = 'administrator'
  var password = process.env.ADMINISTRATOR_PASSWORD
  server(function (port, done) {
    var options = {
      auth: user + ':' + password,
      method: 'POST',
      port: port,
      path: '/publishers/charlie'
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 400, 'POST 400')
      var buffer = []
      response
      .on('data', function (chunk) { buffer.push(chunk) })
      .once('end', function () {
        test.equal(
          Buffer.concat(buffer).toString(), 'invalid publisher',
          'responds "invalid publisher"'
        )
        done()
        test.end()
      })
    }).end(JSON.stringify(body))
  })
})

tape('POST /publishers/:name with insecure password', function (test) {
  var body = {
    email: 'charlie@example.com',
    about: '',
    password: 'password'
  }
  var user = 'administrator'
  var password = process.env.ADMINISTRATOR_PASSWORD
  server(function (port, done) {
    var options = {
      auth: user + ':' + password,
      method: 'POST',
      port: port,
      path: '/publishers/charlie'
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 400, 'POST 400')
      var buffer = []
      response
      .on('data', function (chunk) { buffer.push(chunk) })
      .once('end', function () {
        test.same(
          Buffer.concat(buffer).toString(),
          'invalid password',
          'serves "invalid password"'
        )
        done()
        test.end()
      })
    }).end(JSON.stringify(body))
  })
})

tape('GET /publishers', function (test) {
  var form = {content: ['A test form']}
  var digest = normalize(form).root
  server(function (port, done) {
    series(
      [
        postForm(port, form, test),
        postProject('ana', 'ana\'s password', port, 'x', '1e', digest, test),
        postProject('bob', 'bob\'s password', port, 'y', '1e', digest, test),
        function (done) {
          var options = {port: port, path: '/publishers'}
          http.request(options, function (response) {
            concat(test, response, function (body) {
              test.deepEqual(
                body, ['ana', 'bob'],
                'GET publishers JSON'
              )
              done()
            })
          }).end()
        }
      ],
      function () {
        done()
        test.end()
      }
    )
  })
})

tape('POST /publishers', function (test) {
  server(function (port, done) {
    var options = {method: 'POST', port: port, path: '/publishers'}
    http.request(options, function (response) {
      test.equal(response.statusCode, 405, 'POST 405')
      done()
      test.end()
    }).end()
  })
})
