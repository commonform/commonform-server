var allowAuthorization = require('./allow-authorization')
var annotationKey = require('../keys/annotation')
var annotationPath = require('../paths/annotation')
var badRequest = require('./responses/bad-request')
var encode = require('../keys/encode')
var forbidden = require('./responses/forbidden')
var getAnnotation = require('../queries/get-annotation')
var getForm = require('../queries/get-form')
var internalError = require('./responses/internal-error')
var isDigest = require('is-sha-256-hex-digest')
var isReplyTo = require('../queries/is-reply-to')
var levelLock = require('level-lock')
var mailgun = require('../mailgun')
var methodNotAllowed = require('./responses/method-not-allowed')
var multistream = require('multistream')
var normalize = require('commonform-normalize')
var notFound = require('./responses/not-found')
var parseURL = require('url-parse')
var readJSONBody = require('./read-json-body')
var sendAnnotationNotifications = require('../notifications/annotation')
var unauthorized = require('./responses/unauthorized')
var uuid = require('uuid')
var validAnnotation = require('../validation/annotation')

var PREFIX = 'form-has-annotation'

module.exports = function (request, response) {
  if (request.method === 'GET') {
    allowAuthorization(getAnnotations).apply(this, arguments)
  } else if (request.method === 'POST') {
    allowAuthorization(postAnnotation).apply(this, arguments)
  } else {
    methodNotAllowed(response)
  }
}

function getAnnotations (request, response, parameters, log, level) {
  var query = parseURL(request.url, true).query
  var hasContext = 'context' in query && isDigest(query.context)
  var hasForm = 'form' in query && isDigest(query.form)
  if (!hasContext) {
    badRequest(response, 'Must specify context')
  } else {
    getForm(level, query.context, function (error, context) {
      /* istanbul ignore if */
      if (error) {
        internalError(response, error)
      } else {
        if (!context) {
          notFound(response)
        } else {
          var contexts = computeContexts(normalize(context))
          if (hasForm) {
            if (query.form in contexts) {
              send(
                multistream.obj(
                  Object.keys(contexts)
                    .filter(function (digest) {
                      return (
                        // The form is query.form itself.
                        digest === query.form ||
                        // The form is a child of query.form.
                        contexts[digest].indexOf(query.form) !== -1
                      )
                    })
                    .map(annotationsStream)
                )
              )
            } else {
              badRequest(
                response, query.form + ' not in ' + query.context
              )
            }
          } else {
            send(
              multistream.obj(
                Object.keys(contexts)
                  .map(annotationsStream)
              )
            )
          }
        }
      }
      function send (stream) {
        var first = true
        response.write('[\n')
        stream
          .on('data', function (item) {
            var annotation = item.value
            if (matchesContext(annotation, contexts)) {
              response.write(
                (first ? '' : ',') +
                JSON.stringify(item.value) + '\n'
              )
              first = false
            }
          })
          .once('error', /* istanbul ignore next */ function (error) {
            log.error(error)
            response.end('\n]')
          })
          .once('end', function () {
            response.end('\n]')
          })
      }
    })
  }
  function annotationsStream (digest) {
    return level.createReadStream({
      gt: encode([PREFIX, digest, '']),
      lt: encode([PREFIX, digest, '~'])
    })
  }
}

function matchesContext (annotation, contexts) {
  return (
    annotation.form === annotation.context ||
    contexts[annotation.form].indexOf(annotation.context) !== -1
  )
}

// Produces an object map from digest to an array of parent digests.
function computeContexts (normalized) {
  var result = {}
  // Initialze an empty array property for each digest.
  Object.keys(normalized).forEach(function (digest) {
    if (digest !== 'root') {
      result[digest] = []
    }
  })
  return recurse(normalized.root, [], result)
  function recurse (digest, parents, result) {
    // Push every parent's digest to the list of parents.
    parents.forEach(function (parent) { result[digest].push(parent) })
    // Iterate children.
    normalized[digest].content.forEach(function (element) {
      var isChild = typeof element === 'object' && 'digest' in element
      if (isChild) {
        recurse(element.digest, parents.concat(digest), result)
      }
    })
    return result
  }
}

function postAnnotation (
  request, response, parameters, log, level, write
) {
  readJSONBody(request, response, function (annotation) {
    var put = function (unlock) {
      var entry = { type: 'annotation', data: annotation }
      write(entry, function (error) {
        if (unlock) {
          unlock()
        }
        /* istanbul ignore if */
        if (error) {
          internalError(response, 'internal error')
        } else {
          response.statusCode = 204
          response.setHeader(
            'Location', annotationPath(annotation.uuid)
          )
          response.end()
          /* istanbul ignore else */
          if (mailgun) {
            sendAnnotationNotifications(
              request.configuration,
              annotation,
              log,
              level
            )
          }
        }
      })
    }
    var authorized = request.publisher === annotation.publisher
    if (!validAnnotation(annotation)) {
      badRequest(response, 'Invalid annotation')
    } else if (!authorized) {
      if (request.publisher === false) {
        unauthorized(response)
      } else {
        forbidden(response)
      }
    } else {
      annotation.uuid = uuid.v4()
      response.log.info({ event: 'uuid', uuid: annotation.uuid })
      annotation.timestamp = Date.now().toString()
      // Does the server have the context form?
      getForm(level, annotation.context, function (error, context) {
        /* istanbul ignore if */
        if (error) {
          internalError(response, error)
        } else {
          if (!context) {
            badRequest(response, 'Unknown context')
          } else {
            // Is the annotated form within the context?
            var childrenDigests = Object.keys(normalize(context))
            if (childrenDigests.indexOf(annotation.form) === -1) {
              badRequest(response, 'Form not in context')
            } else {
              if (annotation.replyTo.length !== 0) {
                var parentUUID = annotation.replyTo[0]
                getAnnotation(
                  level, parentUUID,
                  function (error, prior) {
                    /* istanbul ignore if */
                    if (error) {
                      internalError(response, error)
                    } else {
                      if (!prior) {
                        badRequest(response, 'Invalid replyTo')
                      } else {
                        if (!isReplyTo(annotation, prior)) {
                          badRequest(response, 'Does not match parent')
                        } else {
                          var parentKey = annotationKey(parentUUID)
                          var unlock = levelLock(level, parentKey, 'w')
                          /* istanbul ignore if */
                          if (!unlock) {
                            badRequest('Invalid replyTo')
                          } else {
                            put(unlock)
                          }
                        }
                      }
                    }
                  }
                )
              } else {
                put()
              }
            }
          }
        }
      })
    }
  })
}
