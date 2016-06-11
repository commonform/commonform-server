var allowAuthorization = require('./allow-authorization')
var annotationPath = require('../paths/annotation')
var annotationRecord = require('../records/annotation')
var badRequest = require('./responses/bad-request')
var encode = require('../keys/encode')
var equals = require('array-equal')
var forbidden = require('./responses/forbidden')
var getAnnotation = require('../queries/get-annotation')
var getForm = require('./get-form')
var internalError = require('./responses/internal-error')
var isDigest = require('is-sha-256-hex-digest')
var keyForAnnotation = require('../keys/annotation')
var methodNotAllowed = require('./responses/method-not-allowed')
var multistream = require('multistream')
var normalize = require('commonform-normalize')
var parallel = require('async.parallel')
var readJSONBody = require('./read-json-body')
var s3 = require('../s3')
var thrice = require('../thrice')
var unauthorized = require('./responses/unauthorized')
var url = require('url')
var uuid = require('uuid')
var validAnnotation = require('../validation/annotation')

var PREFIX = 'form-has-annotation'

module.exports = function(request, response) {
  if (request.method === 'GET') {
    allowAuthorization(getAnnotations).apply(this, arguments) }
  else if (request.method === 'POST') {
    allowAuthorization(postAnnotation).apply(this, arguments) }
  else { methodNotAllowed(response) } }

function getAnnotations(request, response, parameters, log, level) {
  var query = url.parse(request.url, true).query
  var hasContext = ( ( 'context' in query ) && isDigest(query.context) )
  var hasForm = ( ( 'form' in query ) && isDigest(query.form) )
  if (!hasContext) { badRequest(response, 'Must specify context') }
  else {
    getForm(level, query.context, function(error, context) {
      if (error) {
        /* istanbul ignore else */
        if (error.notFound) { badRequest(response, 'Unknown form') }
        else { internalError(response, error) } }
      else {
        context = JSON.parse(context).form
        var contexts = computeContexts(normalize(context))
        if (hasForm) {
          if (query.form in contexts) {
            send(
              multistream.obj(
                Object.keys(contexts)
                  .filter(function(digest) {
                    return (
                      // The form is query.form itself.
                      ( digest === query.form ) ||
                      // The form is a child of query.form.
                      ( contexts[digest].indexOf(query.form) !== -1 ) ) })
                  .map(annotationsStream))) }
          else {
            badRequest(response, ( query.form + ' not in ' + query.context )) } }
        else {
          send(multistream.obj(Object.keys(contexts).map(annotationsStream))) } }
      function send(stream) {
        var first = true
        response.write('[\n')
        stream
          .on('data', function(item) {
            var annotation = JSON.parse(item.value)
            if (matchesContext(annotation, contexts)) {
              response.write(( ( first ? '' : ',' ) + item.value + '\n' ))
              first = false } })
          .on('error',
            /* istanbul ignore next */
            function(error) {
              log.error(error)
              response.end('\n]') })
          .on('end', function() { response.end('\n]') }) } }) }
  function annotationsStream(digest) {
    return level.createReadStream(
      { gt: encode([ PREFIX, digest, '' ]),
        lt: encode([ PREFIX, digest, '~' ]) }) } }

function matchesContext(annotation, contexts) {
  return (
    ( annotation.form === annotation.context ) ||
    ( contexts[annotation.form].indexOf(annotation.context) !== -1 ) ) }

// Produces an object map from digest to an array of parent digests.
function computeContexts(normalized) {
  var result = { }
  // Initialze an empty array property for each digest.
  Object.keys(normalized)
    .forEach(function(digest) {
      if (digest !== 'root') { result[digest] = [ ] } })
  return recurse(normalized.root, [ ], result)
  function recurse(digest, parents, result) {
    // Push every parent's digest to the list of parents.
    parents.forEach(function(parent) { result[digest].push(parent) })
    // Iterate children.
    normalized[digest].content.forEach(function(element) {
      var isChild = ( ( typeof element === 'object' ) && ( 'digest' in element ) )
      if (isChild) { recurse(element.digest, parents.concat(digest), result) } })
    return result } }

function postAnnotation(request, response, parameters, log, level, emit) {
  var byAdministrator = ( request.publisher === 'administrator' )
  readJSONBody(request, response, function(annotation) {
    var put = function() {
      var key = keyForAnnotation(annotation.uuid)
      var record = JSON.stringify(annotationRecord(annotation))
      var putToLevel = thrice.bind(null, level.put.bind(level, key, record))
      var putOperations = [ putToLevel ]
      /* istanbul ignore if */
      if (s3) {
        var putBackup = thrice.bind(null, s3.put.bind(null, key,record, log))
        putOperations.push(putBackup) }
      parallel(putOperations, function(error) {
        /* istanbul ignore if */
        if (error) { internalError(response, error) }
        else {
          response.log.info({ event: 'annotation' })
          response.statusCode = 201
          response.setHeader('Location', annotationPath(annotation.uuid))
          response.end()
          emit('annotation', annotation, byAdministrator) } }) }
    var authorized =
      ( ( request.publisher === 'administrator' ) ||
        ( request.publisher === annotation.publisher ) )
    if (request.publisher === 'administrator') { put() }
    else {
      if (!validAnnotation(annotation)) {
        badRequest(response, 'Invalid annotation') }
      else if (!authorized) {
        if (request.publisher === false) { unauthorized(response) }
        else { forbidden(response) } }
      else {
          annotation.uuid = uuid.v4()
          response.log.info({ event: 'uuid', uuid: annotation.uuid })
          annotation.timestamp = Date.now().toString()
          // Does the server have the context form?
          getForm(level, annotation.context, function(error, context) {
            if (error) {
              /* istanbul ignore else */
              if (error.notFound) { badRequest(response, 'Unknown context') }
              else { internalError(response, error) } }
            else {
              // Is the annotated form within the context?
              context = JSON.parse(context)
              var childrenDigests = Object.keys(normalize(context.form))
              if (childrenDigests.indexOf(annotation.form) === -1) {
                badRequest(response, 'Form not in context') }
              else {
                if (annotation.replyTo.length !== 0) {
                  getAnnotation(level, annotation.replyTo[0], function(error, stored) {
                    if (error) {
                      /* istanbul ignore else */
                      if (error.notFound) { badRequest(response, 'Invalid replyTo') }
                      else { internalError(response, error) } }
                    else {
                      var prior = JSON.parse(stored).annotation
                      var sameTarget = (
                        ( annotation.context === prior.context ) &&
                        ( annotation.form === prior.form ) &&
                        equals(annotation.replyTo.slice(1), prior.replyTo) )
                      if (!sameTarget) {
                        badRequest(response, 'Does not match parent') }
                      else { put() } } }) }
                else { put() } } } }) } } }) }
