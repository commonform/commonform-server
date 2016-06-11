var badRequest = require('./responses/bad-request')
var formKeyFor = require('../keys/form')
var formPath = require('../paths/form')
var formRecord = require('../records/form')
var internalError = require('./responses/internal-error')
var methodNotAllowed = require('./responses/method-not-allowed')
var normalize = require('commonform-normalize')
var parallel = require('async.parallel')
var readJSONBody = require('./read-json-body')
var s3 = require('../s3')
var thrice = require('../thrice')
var validForm = require('commonform-validate').form

module.exports = function(request, response, parameters, log, level, emit) {
  if (request.method === 'POST') {
    readJSONBody(request, response, function(form) {
      if (!validForm(form)) { badRequest(response, 'invalid form') }
      else {
        var normalized = normalize(form)
        var digest = normalized.root
        response.log.info({ digest: digest })
        var key = formKeyFor(digest)
        var record = JSON.stringify(formRecord(digest, form, true))
        var putToLevel = thrice.bind(null, level.put.bind(level, key, record))
        var putOperations = [ putToLevel ]
        /* istanbul ignore if */
        if (s3) {
          var putBackup = thrice.bind(null, s3.put.bind(null, key, record))
          putOperations.push(putBackup) }
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
