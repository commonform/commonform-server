var badRequest = require('./responses/bad-request')
var getAnnotation = require('../queries/get-annotation')
var getForm = require('./get-form')
var internalError = require('./responses/internal-error')
var methodNotAllowed = require('./responses/method-not-allowed')
var putAnnotation = require('../queries/put-annotation')
var normalize = require('commonform-normalize')
var readJSONBody = require('./read-json-body')
var requireAuthorization = require('./require-authorization')
var uuid = require('uuid')
var validAnnotation = require('../validation/annotation')

module.exports = function(request, response) {
  if (request.method === 'GET') {
    requireAuthorization(getAnnotations).apply(this, arguments) }
  else if(request.method === 'POST') {
    requireAuthorization(postAnnotation).apply(this, arguments) }
  else { methodNotAllowed(response) } }

function postAnnotation(request, response, parameters, log, level, emit) {
  if (request.method === 'POST') {
    readJSONBody(request, response, function(annotation) {
      if (!validAnnotation(annotation)) {
        badRequest(response, 'invalid annotation') }
      else {
        annotation.publisher = parameters.publisher
        annotation.uuid = uuid.v4()
        response.log.info({ event: 'uuid', uuid: annotation.uuid })
        annotation.timestamp = Date.now().toString()
        // Does the server have the context form?
        getForm(level, annotation.context, function(error, context) {
          if (error) {
            if (error.notFound) { badRequest(response, 'Unknown context') }
            else { internalError(response, error) } }
          else {
            // Is the annotated form within the context?
            context = JSON.parse(context)
            var childrenDigests = Object.keys(normalize(context.form))
            if (childrenDigests.indexOf(annotation.form) === -1) {
              badRequest(response, 'Form not in context') }
            else {
              var put = function() {
                putAnnotation(level, annotation, function(error) {
                  if (error) { internalError(response) }
                  else {
                    response.log.info({ event: 'annotation' })
                    response.statusCode = 201
                    response.setHeader(
                      'Location',
                      ( '/annotations/' + annotation.uuid ))
                    response.end()
                    emit('annotation', annotation) } }) }
              if (annotation.replyTo) {
                getAnnotation(level, annotation.replyTo, function(error, prior) {
                  if (error) {
                    if (error.notFound) { badRequest(response, 'Invalid replyTo') }
                    else { internalError(response, error) } }
                  else {
                    if (prior.private === true) {
                      badRequest(response, 'Invalid replyTo') }
                    else {
                      var sameTarget = (
                        ( annotation.context === prior.context ) &&
                        ( annotation.form === prior.form ) )
                      if (!sameTarget) {
                        badRequest(response, 'Does not match replyTo') }
                      else { put() } } } }) }
              else { put() } } } }) } }) }
  else { methodNotAllowed(response) } }

function getAnnotations() {
   }

