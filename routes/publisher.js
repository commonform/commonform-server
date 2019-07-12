var badRequest = require('./responses/bad-request')
var bcrypt = require('bcrypt-password')
var conflict = require('./responses/conflict')
var exists = require('../queries/exists')
var getPublisher = require('../queries/get-publisher')
var gravatarURL = require('gravatar-url')
var has = require('has')
var internalError = require('./responses/internal-error')
var keyForPublisher = require('../keys/publisher')
var lock = require('level-lock')
var methodNotAllowed = require('./responses/method-not-allowed')
var notFound = require('./responses/not-found')
var publisherKeyFor = require('../keys/publisher')
var readJSONBody = require('./read-json-body')
var requireAdministrator = require('./require-administrator')
var requireAuthorization = require('./require-authorization')
var sendJSON = require('./responses/send-json')
var validPassword = require('../validation/password')
var validPublisher = require('../validation/publisher')

module.exports = function (request, response) {
  if (request.method === 'GET') {
    handleGetPublisher.apply(this, arguments)
  } else if (request.method === 'POST') {
    requireAdministrator(postPublisher).apply(this, arguments)
  } else if (request.method === 'PUT') {
    requireAuthorization(putPublisher).apply(this, arguments)
  } else {
    methodNotAllowed(response)
  }
}

function handleGetPublisher (
  request, response, parameters, log, level
) {
  var publisher = parameters.publisher
  getPublisher(level, parameters.publisher, function (error, stored) {
    /* istanbul ignore if */
    if (error) {
      internalError(response, error)
    } else {
      if (!stored) {
        notFound(response)
      } else {
        var json = { publisher: publisher }
        /* istanbul ignore else */
        if (has(stored, 'about')) {
          json.about = stored.about
        }
        json.gravatar = gravatarURL(stored.email)
        sendJSON(response, json)
      }
    }
  })
}

function putPublisher (
  request, response, parameters, log, level, write
) {
  var publisher = parameters.publisher
  readJSONBody(request, response, function (json) {
    json.name = publisher
    if (!validPublisher(json)) {
      badRequest(response, 'invalid publisher')
    } else if (!validPassword(json.password)) {
      badRequest(response, 'invalid password')
    } else {
      var name = json.name
      var key = publisherKeyFor(name)
      var unlock = lock(level, key, 'w')
      /* istanbul ignore if */
      if (!unlock) {
        conflict(response)
      } else {
        exists(level, key, function (error, exists) {
          /* istanbul ignore if */
          if (error) {
            unlock()
            internalError(response, error)
          } else {
            if (!exists) {
              unlock()
              notFound(response)
            } else {
              bcrypt.hash(json.password, function (error, hash) {
                /* istanbul ignore if */
                if (error) {
                  unlock()
                  internalError(response, error)
                } else {
                  var entry = {
                    type: 'publisher',
                    data: {
                      name: name,
                      about: json.about,
                      email: json.email,
                      hash: hash
                    }
                  }
                  write(entry, function (error) {
                    unlock()
                    /* istanbul ignore if */
                    if (error) {
                      internalError(error, 'internal error')
                    } else {
                      response.statusCode = 204
                      var path = '/publishers/' + name
                      response.setHeader('Location', path)
                      response.end()
                    }
                  })
                }
              })
            }
          }
        })
      }
    }
  })
}

function postPublisher (
  request, response, parameters, log, level, write
) {
  var publisher = parameters.publisher
  readJSONBody(request, response, function (json) {
    json.name = publisher
    if (!validPublisher(json)) {
      badRequest(response, 'invalid publisher')
    } else if (!validPassword(json.password)) {
      badRequest(response, 'invalid password')
    } else {
      var name = json.name
      var key = keyForPublisher(name)
      var unlock = lock(level, key, 'w')
      /* istanbul ignore if */
      if (!unlock) {
        conflict(response, new Error('locked'))
      } else {
        exists(level, key, function (error, exists) {
          /* istanbul ignore if */
          if (error) {
            unlock()
            internalError(response, error)
          } else {
            if (exists) {
              unlock()
              conflict(response)
            } else {
              bcrypt.hash(json.password, function (error, hash) {
                /* istanbul ignore if */
                if (error) {
                  unlock()
                  internalError(response, error)
                } else {
                  var entry = {
                    type: 'publisher',
                    data: {
                      name: name,
                      about: json.about,
                      email: json.email,
                      hash: hash
                    }
                  }
                  write(entry, function (error) {
                    unlock()
                    /* istanbul ignore if */
                    if (error) {
                      internalError(error, 'internal error')
                    } else {
                      response.statusCode = 204
                      var path = '/publishers/' + name
                      response.setHeader('Location', path)
                      response.end()
                    }
                  })
                }
              })
            }
          }
        })
      }
    }
  })
}
