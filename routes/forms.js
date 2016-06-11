var backupForm = require('../backup/form')
var badRequest = require('./responses/bad-request')
var formPath = require('../paths/form')
var internalError = require('./responses/internal-error')
var methodNotAllowed = require('./responses/method-not-allowed')
var normalize = require('commonform-normalize')
var parallel = require('async.parallel')
var putForm = require('../queries/put-form')
var readJSONBody = require('./read-json-body')
var s3 = require('../s3')
var validForm = require('commonform-validate').form

module.exports = function(request, response, parameters, log, level, emit) {
  if (request.method === 'POST') {
    readJSONBody(request, response, function(form) {
      if (!validForm(form)) { badRequest(response, 'invalid form') }
      else {
        var normalized = normalize(form)
        var digest = normalized.root
        response.log.info({ digest: digest })
        var putOperations = [ putForm.bind(null, level, digest, form, true) ]
        /* istanbul ignore if */
        if (s3) {
          var writeBackup = backupForm.bind(null, form, digest, normalized, log)
          putOperations.push(writeBackup) }
        parallel(putOperations, function(error) {
          /* istanbul ignore if */
          if (error) { internalError(response, error) }
          else {
            response.log.info({ event: 'form' })
            response.statusCode = 201
            response.setHeader('Location', formPath(digest))
            response.end()
            // Emit an event for the new form. This will trigger
            // indexing and other processing by event handlers
            // on the event emitter.
            emit('form', form, digest, normalized, [ ]) } }) } }) }
  else { methodNotAllowed(response) } }
