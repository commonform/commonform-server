var badRequest = require('./responses/bad-request')
var internalError = require('./responses/internal-error')
var parseJSON = require('json-parse-errback')
var tooLarge = require('./responses/request-entity-too-large')

var LIMIT = parseInt(process.env.MAX_BODY_SIZE) || 256000

module.exports = function (request, response, callback) {
  var buffer
  var finished = false
  var bytesReceived = 0
  var lengthHeader = request.headers['content-length']
  var isTooLarge = lengthHeader && parseInt(lengthHeader) > LIMIT
  if (isTooLarge) {
    tooLarge(response)
  } else {
    buffer = []
    request.on('data', onData)
    request.once('aborted', onAborted)
    request.once('close', finish)
    request.once('end', onEnd)
    request.once('error', onEnd)
  }
  function onData (chunk) {
    /* istanbul ignore else */
    if (!finished) {
      buffer.push(chunk)
      bytesReceived += chunk.length
      if (bytesReceived > LIMIT) {
        finish()
        tooLarge(response)
      }
    }
  }
  /* istanbul ignore next */
  function onAborted () {
    if (!finished) {
      finish()
      badRequest(response, 'request aborted')
    }
  }
  function onEnd (error) {
    /* istanbul ignore else */
    if (!finished) {
      /* istanbul ignore if */
      if (error) {
        request.pause()
        finish()
        internalError(response, error)
      } else {
        var inaccurateHeader = (
          lengthHeader &&
          parseInt(lengthHeader) !== bytesReceived
        )
        /* istanbul ignore if */
        if (inaccurateHeader) {
          finish()
          badRequest(response, 'inaccurate Content-Length')
        } else {
          parseJSON(Buffer.concat(buffer), function (error, object) {
            finish()
            if (error) {
              badRequest(response, 'invalid JSON')
            } else if (object === null) {
              badRequest(response, 'null body')
            } else {
              callback(object)
            }
          })
        }
      }
    }
  }
  function finish () {
    /* istanbul ignore else */
    if (!finished) {
      finished = true
      buffer = null
      request.removeAllListeners()
      request.pause()
    }
  }
}
