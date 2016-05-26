var badRequest = require('./responses/bad-request')
var internalError = require('./responses/internal-error')
var methodNotAllowed = require('./responses/method-not-allowed')
var normalize = require('commonform-normalize')
var putForm = require('../queries/put-form')
var readJSONBody = require('./read-json-body')
var validForm = require('commonform-validate').form

module.exports = function(request, response, parameters, log, level, emit) {
  if (request.method === 'POST') {
    readJSONBody(request, response, function(form) {
      if (!validForm(form)) { badRequest(response, 'invalid form') }
      else {
        var normalized = normalize(form)
        var digest = normalized.root
        response.log.info({ digest: digest })
        putForm(level, digest, form, true, function(error) {
          /* istanbul ignore if */
          if (error) { internalError(response, error) }
          else {
            response.log.info({ event: 'form' })
            response.statusCode = 201
            response.setHeader('Location', ( '/forms/' + digest ))
            response.end()
            // Emit an event for the new form. This will trigger
            // indexing and other processing by event handlers
            // on the event emitter.
            emit('form', form, digest, normalized, [ ]) } }) } }) }
  else { methodNotAllowed(response) } }
