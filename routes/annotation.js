var annotationKey = require('../keys/annotation')
var badRequest = require('./responses/bad-request')
var encode = require('../keys/encode')
var getAnnotation = require('../queries/get-annotation')
var internalError = require('./responses/internal-error')
var isReplyTo = require('../queries/is-reply-to')
var isUUID = require('../validation/uuid')
var levelLock = require('level-lock')
var methodNotAllowed = require('./responses/method-not-allowed')
var notFound = require('./responses/not-found')
var once = require('once')
var sendJSON = require('./responses/send-json')

var PREFIX = 'form-has-annotation'

module.exports = function (
  request, response, params, log, level, write
) {
  var method = request.method
  var uuid
  if (method === 'GET' || method === 'DELETE') {
    uuid = params.uuid
    if (!isUUID(uuid)) {
      notFound(response)
    } else {
      if (method === 'GET') {
        getTheAnnotation(function (annotation) {
          sendJSON(response, annotation)
        })
      } else /* if (method === 'DELETE') */ {
        var key = annotationKey(uuid)
        var unlock = levelLock(level, key, 'w')
        /* istanbul ignore if */
        if (!unlock) {
          cannotDelete(response)
        } else {
          getTheAnnotation(function (annotation) {
            hasReply(level, annotation, function (error, hasReply) {
              /* istanbul ignore if */
              if (error) {
                unlock()
                internalError(response, error)
              } else {
                if (hasReply) {
                  unlock()
                  cannotDelete(response)
                } else {
                  var entry = {
                    type: 'deleteAnnotation',
                    data: {
                      uuid: uuid
                    }
                  }
                  write(entry, function (error) {
                    unlock()
                    /* istanbul ignore if */
                    if (error) {
                      internalError(response, error)
                    } else {
                      response.statusCode = 202
                      response.end()
                    }
                  })
                }
              }
            })
          })
        }
      }
    }
  } else {
    methodNotAllowed(response)
  }

  function getTheAnnotation (callback) {
    getAnnotation(level, uuid, function (error, annotation) {
      /* istanbul ignore if */
      if (error) {
        internalError(response, error)
      } else {
        if (!annotation) {
          notFound(response, error)
        } else {
          callback(annotation)
        }
      }
    })
  }
}

function cannotDelete (response) {
  badRequest(response, 'cannot delete annotation with reply')
}

function hasReply (level, annotation, callback) {
  callback = once(callback)
  level.createReadStream({
    gt: encode([PREFIX, annotation.form, '']),
    lt: encode([PREFIX, annotation.form, '~']),
    keys: false,
    values: true
  })
  .on('data', function (otherAnnotation) {
    if (isReplyTo(otherAnnotation, annotation)) {
      this.destroy()
      callback(null, true)
    }
  })
  .once('end', function () {
    callback(null, false)
  })
  .once('error', /* istanbul ignore next */ function (error) {
    callback(error)
  })
}
