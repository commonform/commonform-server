var concat = require('./concat')
var http = require('http')
var normalize = require('commonform-normalize')
var postForm = require('./post-form')
var series = require('./series')
var server = require('./server')
var tape = require('tape')

var PUBLISHER = 'ana'
var PASSWORD = 'ana\'s password'

var postProject = require('./post-project')
.bind(this, PUBLISHER, PASSWORD)

tape('GET /terms/$term/definitions', function (test) {
  var formA = {content: [{definition: 'Lots'}, ' means two.']}
  var digestA = normalize(formA).root
  var formB = {content: [{definition: 'Lots'}, ' means three.']}
  var digestB = normalize(formB).root
  server(function (port, closeServer) {
    series(
      [
        postForm(port, PUBLISHER, PASSWORD, formA, test),
        postForm(port, PUBLISHER, PASSWORD, formB, test),
        postProject(port, 'defines', '1e', digestA, test),
        function getDefinitions (done) {
          http.request(
            {
              method: 'GET',
              port: port,
              path: '/terms/Lots/definitions'
            },
            function (response) {
              concat(test, response, function (body) {
                test.assert(Array.isArray(body), 'serves a JSON array')
                test.assert(
                  body.indexOf(digestA) !== -1,
                  'serves project form digest'
                )
                test.assert(
                  body.indexOf(digestB) === -1,
                  'does not serve non-project form digest'
                )
                done()
              })
            }
          )
          .end()
        }
      ],
      function () {
        closeServer()
        test.end()
      }
    )
  })
})

tape('GET /terms/$term/uses', function (test) {
  var formA = {content: ['Give us ', {use: 'Lots'}]}
  var digestA = normalize(formA).root
  var formB = {content: ['Give me ', {use: 'Lots'}]}
  var digestB = normalize(formB).root
  server(function (port, closeServer) {
    series(
      [
        postForm(port, PUBLISHER, PASSWORD, formA, test),
        postForm(port, PUBLISHER, PASSWORD, formB, test),
        postProject(port, 'useslots', '1e', digestA, test),
        function getDefinitions (done) {
          http.request(
            {method: 'GET', port: port, path: '/terms/Lots/uses'},
            function (response) {
              concat(test, response, function (body) {
                test.assert(Array.isArray(body), 'serves a JSON array')
                test.assert(
                  body.indexOf(digestA) !== -1,
                  'serves project form digest'
                )
                test.assert(
                  body.indexOf(digestB) === -1,
                  'does not serve non-project form digest'
                )
                done()
              })
            }
          )
          .end()
        }
      ],
      function () {
        closeServer()
        test.end()
      }
    )
  })
})

tape('GET /terms/$term_with_space/uses', function (test) {
  var formA = {content: ['Give us ', {use: 'More Money'}]}
  var digestA = normalize(formA).root
  var formB = {content: ['Give me ', {use: 'More Money'}]}
  var digestB = normalize(formB).root
  server(function (port, closeServer) {
    series(
      [
        postForm(port, PUBLISHER, PASSWORD, formA, test),
        postForm(port, PUBLISHER, PASSWORD, formB, test),
        postProject(port, 'uses', '1e', digestA, test),
        function getDefinitions (done) {
          http.request(
            {
              method: 'GET',
              port: port,
              path: '/terms/More%20Money/uses'
            },
            function (response) {
              concat(test, response, function (body) {
                test.assert(Array.isArray(body), 'serves a JSON array')
                test.assert(
                  body.indexOf(digestA) !== -1,
                  'serves project form digest'
                )
                test.assert(
                  body.indexOf(digestB) === -1,
                  'does not serve non-project form digest'
                )
                done()
              })
            }
          )
          .end()
        }
      ],
      function () {
        closeServer()
        test.end()
      }
    )
  })
})

tape('GET /forms/$digest/parents', function (test) {
  var child = {content: ['Some content']}
  var childDigest = normalize(child).root
  var parent = {content: ['Hooray!', {form: child}]}
  var parentDigest = normalize(parent).root
  var grandparent = {content: ['More!', {form: parent}]}
  var grandparentDigest = normalize(grandparent).root
  server(function (port, closeServer) {
    series(
      [
        postForm(port, PUBLISHER, PASSWORD, grandparent, test),
        postProject(port, 'gpa', '1e', grandparentDigest, test),
        function getParents (done) {
          http.request(
            {
              method: 'GET',
              port: port,
              path: '/forms/' + childDigest + '/parents'
            },
            function (response) {
              concat(test, response, function (body) {
                test.assert(Array.isArray(body), 'serves a JSON array')
                test.assert(
                  body.some(function (element) {
                    return (
                      element.digest === parentDigest &&
                      element.depth === 0
                    )
                  }),
                  'serves parent'
                )
                test.assert(
                  body.some(function (element) {
                    return (
                      element.digest === grandparentDigest &&
                      element.depth === 1
                    )
                  }),
                  'serves grandparent'
                )
                done()
              })
            }
          )
          .end()
        }
      ],
      function () {
        closeServer()
        test.end()
      }
    )
  })
})

tape('POST /forms/$digest/parents', function (test) {
  var child = {content: ['Some content']}
  var childDigest = normalize(child).root
  var parent = {content: ['Hooray!', {form: child}]}
  var grandparent = {content: ['More!', {form: parent}]}
  var grandparentDigest = normalize(grandparent).root
  server(function (port, closeServer) {
    series(
      [
        postForm(port, PUBLISHER, PASSWORD, grandparent, test),
        postProject(port, 'gpa', '1e', grandparentDigest, test),
        function postParents (done) {
          http.request(
            {
              method: 'POST',
              port: port,
              path: '/forms/' + childDigest + '/parents'
            },
            function (response) {
              test.equal(response.statusCode, 405, 'responds 405')
              done()
            }
          )
          .end()
        }
      ],
      function () {
        closeServer()
        test.end()
      }
    )
  })
})

tape('GET /headings/$heading/forms', function (test) {
  var heading = 'X'
  var child = {content: ['Some content']}
  var childDigest = normalize(child).root
  var parent = {content: [{heading: heading, form: child}]}
  var parentDigest = normalize(parent).root
  server(function (port, closeServer) {
    series(
      [
        postForm(port, PUBLISHER, PASSWORD, parent, test),
        postProject(port, 'parent', '1e', parentDigest, test),
        function getParents (done) {
          http.request(
            {
              method: 'GET',
              port: port,
              path: '/headings/' + heading + '/forms'
            },
            function (response) {
              concat(test, response, function (body) {
                test.assert(Array.isArray(body), 'serves a JSON array')
                test.assert(
                  body.some(function (element) {
                    return (
                      element.digest === childDigest &&
                      element.parent === parentDigest
                    )
                  }),
                  'serves parent'
                )
                done()
              })
            }
          )
          .end()
        }
      ],
      function () {
        closeServer()
        test.end()
      }
    )
  })
})

tape('GET /headings/$heading_with_space/forms', function (test) {
  var heading = 'X Heading'
  var child = {content: ['Some content']}
  var childDigest = normalize(child).root
  var parent = {content: [{heading: heading, form: child}]}
  var parentDigest = normalize(parent).root
  server(function (port, closeServer) {
    series(
      [
        postForm(port, PUBLISHER, PASSWORD, parent, test),
        postProject(port, 'parent', '1e', parentDigest, test),
        function getParents (done) {
          http.request(
            {
              method: 'GET',
              port: port,
              path: (
                '/headings/' +
                encodeURIComponent(heading) +
                '/forms'
              )
            },
            function (response) {
              concat(test, response, function (body) {
                test.assert(Array.isArray(body), 'serves a JSON array')
                test.assert(
                  body.some(function (element) {
                    return (
                      element.digest === childDigest &&
                      element.parent === parentDigest
                    )
                  }),
                  'serves parent'
                )
                done()
              })
            }
          )
          .end()
        }
      ],
      function () {
        closeServer()
        test.end()
      }
    )
  })
})

tape('POST /headings/$heading/forms', function (test) {
  var heading = 'X'
  var child = {content: ['Some content']}
  var parent = {content: [{heading: heading, form: child}]}
  var parentDigest = normalize(parent).root
  server(function (port, closeServer) {
    series(
      [
        postForm(port, PUBLISHER, PASSWORD, parent, test),
        postProject(port, 'parent', '1e', parentDigest, test),
        function (done) {
          http.request(
            {
              method: 'POST',
              port: port,
              path: '/headings/' + heading + '/forms'
            },
            function (response) {
              test.equal(response.statusCode, 405, 'responds 405')
              done()
            }
          )
          .end()
        }
      ],
      function () {
        closeServer()
        test.end()
      }
    )
  })
})

tape('GET /forms/$form/headings', function (test) {
  var heading = 'X'
  var child = {content: ['Some content']}
  var childDigest = normalize(child).root
  var parent = {content: [{heading: heading, form: child}]}
  var parentDigest = normalize(parent).root
  server(function (port, closeServer) {
    series(
      [
        postForm(port, PUBLISHER, PASSWORD, parent, test),
        postProject(port, 'parent', '1e', parentDigest, test),
        function getParents (done) {
          http.request(
            {
              method: 'GET',
              port: port,
              path: '/forms/' + childDigest + '/headings'
            },
            function (response) {
              concat(test, response, function (body) {
                test.assert(Array.isArray(body), 'serves a JSON array')
                test.assert(
                  body.some(function (element) {
                    return (
                      element.heading === heading.toLowerCase() &&
                      element.parent === parentDigest
                    )
                  }),
                  'serves heading in parent'
                )
                done()
              })
            }
          )
          .end()
        }
      ],
      function () {
        closeServer()
        test.end()
      }
    )
  })
})

tape('POST /forms/$form/headings', function (test) {
  var heading = 'X'
  var child = {content: ['Some content']}
  var childDigest = normalize(child).root
  var parent = {content: [{heading: heading, form: child}]}
  server(function (port, closeServer) {
    series(
      [
        postForm(port, PUBLISHER, PASSWORD, parent, test),
        function (done) {
          http.request(
            {
              method: 'POST',
              port: port,
              path: '/forms/' + childDigest + '/headings'
            },
            function (response) {
              test.equal(response.statusCode, 405, 'responds 405')
              done()
            }
          )
          .end()
        }
      ],
      function () {
        closeServer()
        test.end()
      }
    )
  })
})

tape('GET /headings/$heading/references', function (test) {
  var heading = 'X'
  var form = {content: [{reference: heading}]}
  var digest = normalize(form).root
  server(function (port, closeServer) {
    series(
      [
        postForm(port, PUBLISHER, PASSWORD, form, test),
        postProject(port, 'parent', '1e', digest, test),
        function getReferences (done) {
          http.request(
            {
              method: 'GET',
              port: port,
              path: '/headings/' + heading + '/references'
            },
            function (response) {
              concat(test, response, function (body) {
                test.assert(Array.isArray(body), 'serves a JSON array')
                test.assert(body.indexOf(digest) !== -1, 'serves form')
                done()
              })
            }
          )
          .end()
        }
      ],
      function () {
        closeServer()
        test.end()
      }
    )
  })
})

tape('GET /headings', function (test) {
  var heading = 'X'
  var form = {content: [{reference: heading}]}
  var digest = normalize(form).root
  server(function (port, closeServer) {
    series(
      [
        postForm(port, PUBLISHER, PASSWORD, form, test),
        postProject(port, 'parent', '1e', digest, test),
        function getHeadings (done) {
          http.request(
            {method: 'GET', port: port, path: '/headings'},
            function (response) {
              concat(test, response, function (body) {
                test.assert(Array.isArray(body), 'serves a JSON array')
                test.assert(
                  body.indexOf(heading.toLowerCase()) !== -1,
                  'serves heading'
                )
                done()
              })
            }
          )
          .end()
        }
      ],
      function () {
        closeServer()
        test.end()
      }
    )
  })
})

tape('GET /projects/$project/publishers', function (test) {
  var project = 'superduper'
  var form = {content: ['super duper content']}
  var digest = normalize(form).root
  server(function (port, closeServer) {
    series(
      [
        postForm(port, PUBLISHER, PASSWORD, form, test),
        postProject(port, project, '1e', digest, test),
        function getReferences (done) {
          http.request(
            {
              method: 'GET',
              port: port,
              path: '/projects/' + project + '/publishers'
            },
            function (response) {
              concat(test, response, function (body) {
                test.assert(Array.isArray(body), 'serves a JSON array')
                test.assert(
                  body.indexOf(PUBLISHER.toLowerCase()) !== -1,
                  'serves form'
                )
                done()
              })
            }
          )
          .end()
        }
      ],
      function () {
        closeServer()
        test.end()
      }
    )
  })
})

