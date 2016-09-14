var concat = require('./concat')
var http = require('http')
var normalize = require('commonform-normalize')
var postAnnotation = require('./post-annotation')
var postForm = require('./post-form')
var series = require('./series')
var server = require('./server')
var tape = require('tape')
var uuid = require('uuid')

var PUBLISHER = 'ana'
var PASSWORD = 'ana\'s password'

tape('POST /annotations', function (test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var child = {content: ['The child']}
  var childDigest = normalize(child).root
  var parent = {content: [{form: child}]}
  var parentDigest = normalize(parent).root
  var annotation = {
    publisher: publisher,
    form: childDigest,
    context: parentDigest,
    replyTo: [],
    text: 'Not good'
  }
  server(function (port, done) {
    series(
      [
        postForm(port, publisher, password, parent, test),
        postAnnotation(publisher, password, port, annotation, test)
      ],
      function () {
        done()
        test.end()
      }
    )
  })
})

tape('POST /annotations with invalid annotation', function (test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var form = {content: ['The form']}
  var digest = normalize(form).root
  var annotation = {
    publisher: publisher,
    form: digest,
    text: 'Not good'
  }
  server(function (port, done) {
    series(
      [
        postForm(port, publisher, password, form, test),
        function (done) {
          var options = {
            method: 'POST',
            port: port,
            path: '/annotations',
            headers: {
              'Content-Type': 'application/json'
            },
            auth: publisher + ':' + password
          }
          http.request(options, function (response) {
            test.equal(response.statusCode, 400, '400')
            var buffer = []
            response
            .on('data', function (chunk) {
              buffer.push(chunk)
            })
            .once('end', function () {
              var body = Buffer.concat(buffer).toString()
              test.equal(body, 'Invalid annotation', 'invalid')
              done()
            })
          })
          .end(JSON.stringify(annotation))
        }
      ],
      function () {
        done()
        test.end()
      }
    )
  })
})

tape('POST /annotations without authorization', function (test) {
  var form = {content: ['The child']}
  var digest = normalize(form).root
  var annotation = {
    publisher: 'bob',
    form: digest,
    context: digest,
    replyTo: [],
    text: 'Not good'
  }
  server(function (port, done) {
    series(
      [
        postForm(port, PUBLISHER, PASSWORD, form, test),
        function (done) {
          var options = {
            method: 'POST',
            port: port,
            headers: {
              'Content-Type': 'application/json'
            },
            path: '/annotations'
          }
          http.request(options, function (response) {
            test.equal(response.statusCode, 401, '401')
            done()
          })
          .end(JSON.stringify(annotation))
        }
      ],
      function () {
        done()
        test.end()
      }
    )
  })
})

tape('POST /annotations for another publisher', function (test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var child = {content: ['The child']}
  var childDigest = normalize(child).root
  var parent = {content: [{form: child}]}
  var parentDigest = normalize(parent).root
  var annotation = {
    publisher: 'bob',
    form: childDigest,
    context: parentDigest,
    replyTo: [],
    text: 'Not good'
  }
  server(function (port, done) {
    series(
      [
        postForm(port, publisher, password, parent, test),
        function (done) {
          var options = {
            method: 'POST',
            port: port,
            auth: publisher + ':' + password,
            headers: {
              'Content-Type': 'application/json'
            },
            path: '/annotations'
          }
          http.request(options, function (response) {
            test.equal(response.statusCode, 403, '403')
            done()
          })
          .end(JSON.stringify(annotation))
        }
      ],
      function () {
        done()
        test.end()
      }
    )
  })
})

tape('POST /annotations with bad password', function (test) {
  var publisher = 'ana'
  var password = 'not ana\'s password'
  var form = {content: ['The form']}
  var digest = normalize(form).root
  var annotation = {
    publisher: 'bob',
    form: digest,
    context: digest,
    replyTo: [],
    text: 'Not good'
  }
  server(function (port, done) {
    series(
      [
        postForm(port, PUBLISHER, PASSWORD, form, test),
        function (done) {
          var options = {
            method: 'POST',
            port: port,
            auth: publisher + ':' + password,
            headers: {
              'Content-Type': 'application/json'
            },
            path: '/annotations'
          }
          http.request(options, function (response) {
            test.equal(response.statusCode, 401, '401')
            done()
          })
          .end(JSON.stringify(annotation))
        }
      ],
      function () {
        done()
        test.end()
      }
    )
  })
})

tape('POST /annotations with form not in context', function (test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var a = {content: ['A form']}
  var aDigest = normalize(a).root
  var b = {content: ['Another form']}
  var bDigest = normalize(b).root
  var annotation = {
    publisher: publisher,
    form: aDigest,
    context: bDigest,
    replyTo: [],
    text: 'Not good'
  }
  server(function (port, done) {
    series(
      [
        postForm(port, publisher, password, a, test),
        postForm(port, publisher, password, b, test),
        function (done) {
          var options = {
            method: 'POST',
            port: port,
            auth: publisher + ':' + password,
            headers: {
              'Content-Type': 'application/json'
            },
            path: '/annotations'
          }
          http.request(options, function (response) {
            test.equal(response.statusCode, 400, '400')
            var buffer = []
            response
            .on('data', function (chunk) {
              buffer.push(chunk)
            })
            .once('end', function () {
              var body = Buffer.concat(buffer).toString()
              test.equal(
                body, 'Form not in context',
                'form not in context'
              )
              done()
            })
          })
          .end(JSON.stringify(annotation))
        }
      ],
      function () {
        done()
        test.end()
      }
    )
  })
})

tape('POST /annotations with reply', function (test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var child = {content: ['The child']}
  var childDigest = normalize(child).root
  var parent = {content: [{form: child}]}
  var parentDigest = normalize(parent).root
  var annotation = {
    publisher: publisher,
    form: childDigest,
    context: parentDigest,
    replyTo: [],
    text: 'Not good'
  }
  var reply
  server(function (port, done) {
    series(
      [
        postForm(port, publisher, password, parent, test),
        function (done) {
          postAnnotation(
            publisher, password, port, annotation, test
          )(withLocation)
          function withLocation (error, location) {
            test.ifError(error)
            reply = {
              publisher: publisher,
              form: childDigest,
              context: parentDigest,
              replyTo: [location.replace('/annotations/', '')],
              text: 'On second thought...'
            }
            done()
          }
        },
        function (done) {
          postAnnotation(publisher, password, port, reply, test)(done)
        }
      ],
      function () {
        done()
        test.end()
      }
    )
  })
})

tape('POST /annotations with reply to nonexistent', function (test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var form = {content: ['The child']}
  var digest = normalize(form).root
  var annotation = {
    publisher: publisher,
    form: digest,
    context: digest,
    replyTo: [uuid.v4()],
    text: 'Not good'
  }
  server(function (port, done) {
    series(
      [
        postForm(port, publisher, password, form, test),
        function (done) {
          var options = {
            method: 'POST',
            port: port,
            path: '/annotations',
            headers: {
              'Content-Type': 'application/json'
            },
            auth: publisher + ':' + password
          }
          http.request(options, function (response) {
            test.equal(response.statusCode, 400, '400')
            done()
          })
          .end(JSON.stringify(annotation))
        }
      ],
      function () {
        done()
        test.end()
      }
    )
  })
})

tape('POST /annotations with mismatched context', function (test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var child = {content: ['The child']}
  var childDigest = normalize(child).root
  var parent = {content: [{form: child}]}
  var parentDigest = normalize(parent).root
  var annotation = {
    publisher: publisher,
    form: childDigest,
    context: parentDigest,
    replyTo: [],
    text: 'Not good'
  }
  var reply = JSON.parse(JSON.stringify(annotation))
  reply.context = childDigest
  server(function (port, done) {
    series(
      [
        postForm(port, publisher, password, parent, test),
        function (done) {
          postAnnotation(
            publisher, password, port, annotation, test
          )(withLocation)
          function withLocation (error, location) {
            test.ifError(error)
            reply.replyTo = [location.replace('/annotations/', '')]
            done()
          }
        },
        function (done) {
          var options = {
            method: 'POST',
            path: '/annotations',
            port: port,
            headers: {
              'Content-Type': 'application/json'
            },
            auth: publisher + ':' + password
          }
          http.request(options, function (response) {
            test.equal(response.statusCode, 400, '400')
            var buffer = []
            response
            .on('data', function (chunk) {
              buffer.push(chunk)
            })
            .once('end', function () {
              var body = Buffer.concat(buffer).toString()
              test.equal(
                body, 'Does not match parent',
                'does not match'
              )
              done()
            })
          })
          .end(JSON.stringify(reply))
        }
      ],
      function () {
        done()
        test.end()
      }
    )
  })
})

tape('POST /annotations with unknown context', function (test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var form = {content: ['The child']}
  var digest = normalize(form).root
  var annotation = {
    publisher: publisher,
    form: digest,
    context: digest,
    replyTo: [],
    text: 'Not good'
  }
  server(function (port, done) {
    var options = {
      method: 'POST',
      path: '/annotations',
      port: port,
      headers: {
        'Content-Type': 'application/json'
      },
      auth: publisher + ':' + password
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 400, '400')
      var buffer = []
      response
      .on('data', function (chunk) {
        buffer.push(chunk)
      })
      .once('end', function () {
        var body = Buffer.concat(buffer).toString()
        test.equal(body, 'Unknown context', 'unknown context')
        done()
        test.end()
      })
    })
    .end(JSON.stringify(annotation))
  })
})

tape('GET /annotation/{uuid}', function (test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var child = {content: ['The child']}
  var childDigest = normalize(child).root
  var parent = {content: [{form: child}]}
  var parentDigest = normalize(parent).root
  var annotation = {
    publisher: publisher,
    form: childDigest,
    context: parentDigest,
    replyTo: [],
    text: 'Not good'
  }
  var uuid
  server(function (port, done) {
    series(
      [
        postForm(port, publisher, password, parent, test),
        function (done) {
          postAnnotation(
            publisher, password, port, annotation, test
          )(withLocation)
          function withLocation (error, location) {
            test.ifError(error)
            uuid = location.replace('/annotations/', '')
            done()
          }
        },
        function (done) {
          var options = {port: port, path: '/annotations/' + uuid}
          http.request(options, function (response) {
            test.equal(response.statusCode, 200, 'GET 200')
            concat(test, response, function (body) {
              test.equal(body.text, annotation.text, 'serves text')
              done()
            })
          })
          .end()
        }
      ],
      function () {
        done()
        test.end()
      }
    )
  })
})

tape('DELETE /annotation/{uuid}', function (test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var child = {content: ['The child']}
  var childDigest = normalize(child).root
  var parent = {content: [{form: child}]}
  var parentDigest = normalize(parent).root
  var annotation = {
    publisher: publisher,
    form: childDigest,
    context: parentDigest,
    replyTo: [],
    text: 'Not good'
  }
  var annotationLocation
  server(function (port, done) {
    series(
      [
        postForm(port, publisher, password, parent, test),
        function (done) {
          postAnnotation(
            publisher, password, port, annotation, test
          )(withLocation)
          function withLocation (error, location) {
            test.ifError(error, 'no error')
            annotationLocation = location
            setTimeout(done, 200)
          }
        },
        function (done) {
          var options = {
            method: 'DELETE',
            port: port,
            path: annotationLocation,
            headers: {
              'Content-Type': 'application/json'
            },
            auth: publisher + ':' + password
          }
          http.request(options, function (response) {
            test.equal(response.statusCode, 202, 'DELETE 202')
            // Wait a bit for the sever to write the delete entry to the
            // log, receive it back, and process it.
            setTimeout(done, 200)
          })
          .end()
        },
        function (done) {
          var options = {
            method: 'GET',
            port: port,
            path: annotationLocation
          }
          http.request(options, function (response) {
            test.equal(response.statusCode, 404, 'GET 404')
            done()
          })
          .end()
        }
      ],
      function () {
        done()
        test.end()
      }
    )
  })
})

tape('DELETE /annotation/{has reply}', function (test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var child = {content: ['The child']}
  var childDigest = normalize(child).root
  var parent = {content: [{form: child}]}
  var parentDigest = normalize(parent).root
  var annotation = {
    publisher: publisher,
    form: childDigest,
    context: parentDigest,
    replyTo: [],
    text: 'Not good'
  }
  var reply
  var annotationLocation
  server(function (port, done) {
    series(
      [
        postForm(port, publisher, password, parent, test),
        function (done) {
          postAnnotation(
            publisher, password, port, annotation, test
          )(withLocation)
          function withLocation (error, location) {
            test.ifError(error, 'no error')
            annotationLocation = location
            reply = {
              publisher: publisher,
              form: childDigest,
              context: parentDigest,
              replyTo: [location.replace('/annotations/', '')],
              text: 'On second thought...'
            }
            setTimeout(done, 200)
          }
        },
        function (done) {
          postAnnotation(publisher, password, port, reply, test)(
            function (error) {
              if (error) {
                done(error)
              } else {
                setTimeout(done, 200)
              }
            }
          )
        },
        function (done) {
          var options = {
            method: 'DELETE',
            port: port,
            path: annotationLocation,
            auth: publisher + ':' + password
          }
          http.request(options, function (response) {
            test.equal(response.statusCode, 400, 'DELETE 400')
            var buffer = []
            response
            .on('data', function (chunk) {
              buffer.push(chunk)
            })
            .once('error', function (error) {
              test.ifError(error, 'no error')
            })
            .once('end', function () {
              var body = Buffer.concat(buffer).toString()
              test.equal(
                body,
                'cannot delete annotation with reply',
                'has replies'
              )
              done()
            })
          })
          .end()
        }
      ],
      function () {
        done()
        test.end()
      }
    )
  })
})

tape('PATCH /annotation/{uuid}', function (test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  var form = {content: ['The form']}
  var digest = normalize(form).root
  var annotation = {
    publisher: publisher,
    form: digest,
    context: digest,
    replyTo: [],
    text: 'Not good'
  }
  var uuid
  server(function (port, done) {
    series(
      [
        postForm(port, publisher, password, form, test),
        function (done) {
          postAnnotation(
            publisher, password, port, annotation, test
          )(withLocation)
          function withLocation (error, location) {
            test.ifError(error)
            uuid = location.replace('/annotations/', '')
            done()
          }
        },
        function (done) {
          var options = {
            method: 'PATCH',
            port: port,
            path: '/annotations/' + uuid
          }
          http.request(options, function (response) {
            test.equal(response.statusCode, 405, '405')
            done()
          })
          .end()
        }
      ],
      function () {
        done()
        test.end()
      }
    )
  })
})

tape('GET /annotation/{not_a_uuid}', function (test) {
  server(function (port, done) {
    var options = {port: port, path: '/annotations/x'}
    http.request(options, function (response) {
      test.equal(response.statusCode, 404, '404')
      done()
      test.end()
    })
    .end()
  })
})

tape('GET /annotation/{nonexistent}', function (test) {
  server(function (port, done) {
    var options = {port: port, path: '/annotations/' + uuid.v4()}
    http.request(options, function (response) {
      test.equal(response.statusCode, 404, '404')
      done()
      test.end()
    })
    .end()
  })
})

tape('GET /annotations without query', function (test) {
  server(function (port, done) {
    var options = {port: port, path: '/annotations'}
    http.request(options, function (response) {
      test.equal(response.statusCode, 400, 'GET 400')
      done()
      test.end()
    })
    .end()
  })
})

tape('DELETE /annotations', function (test) {
  server(function (port, done) {
    var options = {method: 'DELETE', port: port, path: '/annotations'}
    http.request(options, function (response) {
      test.equal(response.statusCode, 405, 'DELETE 405')
      done()
      test.end()
    })
    .end()
  })
})

tape('GET /annotations?context={digest}', function (test) {
  var publisher = 'ana'
  var password = 'ana\'s password'
  // Forms
  var forms = {}
  //   A <<< context
  //   +-B
  //   | +-C
  //   |   +-D
  //   +-E
  //   | +-F
  //   +-G
  forms.g = {content: ['This is G']}
  forms.f = {content: ['This is F']}
  forms.e = {content: [{form: forms.f}]}
  forms.d = {content: ['This is D']}
  forms.c = {content: [{form: forms.d}]}
  forms.b = {content: [{form: forms.c}]}
  forms.a = {
    content: [
      {form: forms.b},
      {form: forms.e},
      {form: forms.g}
    ]
  }
  //   X <<< not context
  //   +-D
  forms.x = {content: ['This is X', {form: forms.d}]}
  // Digests
  var digests = {}
  Object.keys(forms).forEach(function (key) {
    digests[key] = normalize(forms[key]).root
  })
  // Annotations
  var annotations = {};
  [
    {form: 'd', context: 'b'},
    {form: 'd', context: 'x'},
    {form: 'd', context: 'a'},
    {form: 'f', context: 'f'},
    {form: 'a', context: 'a'}
  ].forEach(function (element) {
    var form = element.form
    var context = element.context
    var key = form.toUpperCase() + 'in' + context.toUpperCase()
    annotations[key] = {
      publisher: publisher,
      form: digests[form],
      context: digests[context],
      replyTo: [],
      text: 'Annotation of ' + form + ' in context of ' + context
    }
  })
  server(function (port, done) {
    series(
      [
        postForm(port, publisher, password, forms.a, test),
        postForm(port, publisher, password, forms.x, test),
        postAnnotation(
          publisher, password, port, annotations.DinB, test
        ),
        postAnnotation(
          publisher, password, port, annotations.DinX, test
        ),
        postAnnotation(
          publisher, password, port, annotations.DinA, test
        ),
        postAnnotation(
          publisher, password, port, annotations.FinF, test
        ),
        postAnnotation(
          publisher, password, port, annotations.AinA, test
        ),
        function (done) {
          var options = {
            port: port,
            path: '/annotations' + '?' + 'context=' + digests.a
          }
          http.request(options, function (response) {
            test.equal(response.statusCode, 200, 'GET 200')
            concat(test, response, function (body) {
              test.equal(body.length, 4, 'serves annotations')
              test.assert(
                body.some(function (element) {
                  return element.text === annotations.DinB.text
                }),
                'serves annotation of D in B'
              )
              test.assert(
                !body.some(function (element) {
                  return element.text === annotations.DinX.text
                }),
                'does not serve annotation of D in X'
              )
              test.assert(
                body.some(function (element) {
                  return element.text === annotations.DinA.text
                }),
                'serves annotation of D in A'
              )
              test.assert(
                body.some(function (element) {
                  return element.text === annotations.FinF.text
                }),
                'serves annotation of F in F'
              )
              test.assert(
                body.some(function (element) {
                  return element.text === annotations.AinA.text
                }),
                'serves annotation of A in A'
              )
              done()
            })
          })
          .end()
        }
      ],
      function () {
        done()
        test.end()
      }
    )
  })
})

tape('GET /annotations?context={nonexistent}', function (test) {
  var nonexistent = (
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' +
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  )
  server(function (port, done) {
    var options = {
      port: port,
      path: '/annotations' + '?' + 'context=' + nonexistent
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 404, 'GET 404')
      done()
      test.end()
    })
    .end()
  })
})

tape(
  'GET /annotations?context={digest}&form={digest}',
  function (test) {
    var publisher = 'ana'
    var password = 'ana\'s password'
    // Forms
    var forms = {}
    //   A <<< context
    //   +-B
    //   | +-C
    //   |   +-D
    //   +-E
    //   | +-F
    //   +-G
    forms.g = {content: ['This is G']}
    forms.f = {content: ['This is F']}
    forms.e = {content: [{form: forms.f}]}
    forms.d = {content: ['This is D']}
    forms.c = {content: [{form: forms.d}]}
    forms.b = {content: [{form: forms.c}]}
    forms.a = {
      content: [
        {form: forms.b},
        {form: forms.e},
        {form: forms.g}
      ]
    }
    //   X <<< not context
    //   +-D
    forms.x = {content: ['This is X', {form: forms.d}]}
    // Digests
    var digests = {}
    Object.keys(forms).forEach(function (key) {
      digests[key] = normalize(forms[key]).root
    })
    // Annotations
    var annotations = {}
    ;[
      {form: 'd', context: 'b'},
      {form: 'd', context: 'x'},
      {form: 'd', context: 'a'},
      {form: 'f', context: 'f'},
      {form: 'a', context: 'a'}
    ].forEach(function (element) {
      var form = element.form
      var context = element.context
      var key = form.toUpperCase() + 'in' + context.toUpperCase()
      annotations[key] = {
        publisher: publisher,
        form: digests[form],
        context: digests[context],
        replyTo: [],
        text: 'Annotation of ' + form + ' in context of ' + context
      }
    })
    server(function (port, done) {
      series(
        [
          postForm(port, publisher, password, forms.a, test),
          postForm(port, publisher, password, forms.x, test),
          postAnnotation(
            publisher, password, port, annotations.DinB, test
          ),
          postAnnotation(
            publisher, password, port, annotations.DinX, test
          ),
          postAnnotation(
            publisher, password, port, annotations.DinA, test
          ),
          postAnnotation(
            publisher, password, port, annotations.FinF, test
          ),
          postAnnotation(
            publisher, password, port, annotations.AinA, test
          ),
          function (done) {
            var options = {
              port: port,
              path: (
                '/annotations' +
                '?' + 'context=' + digests.a +
                '&' + 'form=' + digests.b
              )
            }
            http.request(options, function (response) {
              test.equal(response.statusCode, 200, 'GET 200')
              concat(test, response, function (body) {
                test.equal(body.length, 2, 'serves annotations')
                test.assert(
                  body.some(function (element) {
                    return element.text === annotations.DinB.text
                  }),
                  'serves annotation of D in B'
                )
                test.assert(
                  !body.some(function (element) {
                    return element.text === annotations.DinX.text
                  }),
                  'does not serve annotation of D in X'
                )
                test.assert(
                  body.some(function (element) {
                    return element.text === annotations.DinA.text
                  }),
                  'does not serve annotation of D in A'
                )
                test.assert(
                  !body.some(function (element) {
                    return element.text === annotations.FinF.text
                  }),
                  'does not serve annotation of F in F'
                )
                test.assert(
                  !body.some(function (element) {
                    return element.text === annotations.AinA.text
                  }),
                  'does not serve annotation of A in A'
                )
                done()
              })
            })
            .end()
          }
        ],
        function () {
          done()
          test.end()
        }
      )
    })
  }
)

tape(
  'GET /annotations?context={digest}&form={not_in_context}',
  function (test) {
    // Forms
    var forms = {}
    forms.a = {content: ['This is A']}
    forms.b = {content: ['This is B']}
    // Digests
    var digests = {}
    Object.keys(forms).forEach(function (key) {
      digests[key] = normalize(forms[key]).root
    })
    // Annotations
    server(function (port, done) {
      series(
        [
          postForm(port, PUBLISHER, PASSWORD, forms.a, test),
          postForm(port, PUBLISHER, PASSWORD, forms.b, test),
          function (done) {
            var options = {
              port: port,
              path: (
                '/annotations' +
                '?' + 'context=' + digests.a +
                '&' + 'form=' + digests.b
              )
            }
            http.request(options, function (response) {
              test.equal(response.statusCode, 400, 'GET 400')
              var buffer = []
              response
              .on('data', function (chunk) {
                buffer.push(chunk)
              })
              .once('end', function () {
                var body = Buffer.concat(buffer).toString()
                test.equal(
                  body,
                  digests.b + ' not in ' + digests.a,
                  'form not in context'
                )
                done()
              })
            })
            .end()
          }
        ],
        function () {
          done()
          test.end()
        })
    })
  }
)
