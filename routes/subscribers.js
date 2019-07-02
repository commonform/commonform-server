var internalError = require('./responses/internal-error')
var keyFor = require('../keys/subscription')
var methodNotAllowed = require('./responses/method-not-allowed')
var notFound = require('./responses/not-found')
var requireAuthorization = require('./require-authorization')

module.exports = function (to, keys) {
  return function (request, response) {
    var method = request.method
    if (method === 'POST') {
      var postSubscriber = makeRecord('subscription')
      requireAuthorization(postSubscriber).apply(this, arguments)
    } else if (method === 'DELETE') {
      var deleteSubscriber = makeRecord('unsubscription')
      requireAuthorization(deleteSubscriber).apply(this, arguments)
    } else if (method === 'GET') {
      requireAuthorization(getSubscriber).apply(this, arguments)
    } else methodNotAllowed(response)
  }

  function makeRecord (type) {
    return function (request, response, parameters, log, level, write) {
      var data = { to: to }
      var entry = { type: type, data: data }
      keys.forEach(function (key) {
        data[key] = parameters[key]
      })
      write(entry, function (error) {
        /* istanbul ignore if */
        if (error) {
          internalError(response, error)
        } else {
          response.statusCode = 204
          response.end()
        }
      })
    }
  }

  function getSubscriber (request, response, parameters, log, level) {
    var keyComponents = []
    keys.forEach(function (key) {
      keyComponents.push(key)
      keyComponents.push(parameters[key])
    })
    level.get(keyFor(keyComponents), function (error, publisher) {
      if (error) {
        /* istanbul ignore else */
        if (error.notFound) {
          notFound(response)
        } else {
          internalError(response, error)
        }
      } else {
        response.statusCode = 200
        response.end()
      }
    })
  }
}
