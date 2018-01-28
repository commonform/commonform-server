var badRequest = require('./responses/bad-request')
var formPath = require('../paths/form')
var internalError = require('./responses/internal-error')
var methodNotAllowed = require('./responses/method-not-allowed')
var normalize = require('commonform-normalize')
var readJSONBody = require('./read-json-body')
var requireAuthorization = require('./require-authorization')
var validForm = require('../validation/form')

module.exports = function (
  request, response, parameters, log, level, write
) {
  if (request.method === 'POST') {
    requireAuthorization(postForm, true).apply(this, arguments)
  } else {
    methodNotAllowed(response)
  }
}

function postForm (request, response, parameters, log, level, write) {
  readJSONBody(request, response, function (form) {
    if (!validForm(form)) {
      badRequest(response, 'invalid form')
    } else {
      var digest = normalize(form).root
      response.log.info({digest: digest})
      var entry = {type: 'form', data: form}
      write(entry, function (error) {
        /* istanbul ignore if */
        if (error) {
          internalError(response, 'internal error')
        } else {
          response.statusCode = 204
          response.setHeader('Location', formPath(digest))
          response.end()
        }
      })
    }
  })
}
