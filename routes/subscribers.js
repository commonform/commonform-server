var decode = require('../keys/decode')
var internalError = require('./responses/internal-error')
var keyFor = require('../keys/subscription')
var methodNotAllowed = require('./responses/method-not-allowed')
var requireAuthorization = require('./require-authorization')

module.exports = function (to, keys) {
  return function (request, response) {
    var method = request.method
    if (method === 'POST') {
      var postSubscriber = makeRecord('subscribed')
      requireAuthorization(postSubscriber).apply(this, arguments)
    } else if (method === 'DELETE') {
      var deleteSubscriber = makeRecord('unsubscribed')
      requireAuthorization(deleteSubscriber).apply(this, arguments)
    } else if (method === 'GET') {
      requireAuthorization(getSubscriber).apply(this, arguments)
    } else methodNotAllowed(response)
  }

  function makeRecord (type) {
    return function (request, response, parameters, log, level, write) {
      var data = {to: to, date: iso8601()}
      keys.forEach(function (key) {
        data[key] = parameters[key]
      })
      var entry = {type: type, data: data}
      write(entry, function (error) {
        if (error) internalError(response, error)
        else {
          response.statusCode = 204
          response.end()
        }
      })
    }
  }

  function getSubscriber (request, response, parameters, log, level) {
    var keyComponents = makeComponents(to, keys, parameters, '')
    keyComponents.splice(-2, 2)
    level.createReadStream({
      gt: keyFor(keyComponents.concat('')),
      lt: keyFor(keyComponents.concat('~')),
      keys: true,
      values: false,
      reverse: true,
      limit: 1
    })
    .once('error', function (error) { internalError(response, error) })
    .once('data', function (key) {
      var decoded = decode(key)
      var action = decoded[decoded.length - 1]
      if (action === 'subscribed') {
        response.statusCode = 204
        response.end()
      } else /* if (action === 'unsubscribed') */ {
        notFound()
      }
    })
    .once('end', notFound)
    function notFound () {
      response.statusCode = 404
      response.end()
    }
  }
}

function iso8601 () { return new Date().toISOString() }

function makeComponents (type, keys, parameters, event) {
  return [type]
  .concat(keys.map(function (key) { return parameters[key] }))
  .concat(iso8601())
  .concat(event)
}
