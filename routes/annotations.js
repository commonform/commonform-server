var allowAuthorization = require('./allow-authorization')
var encode = require('../keys/encode')
var url = require('url')
var multistream = require('multistream')
var isDigest = require('is-sha-256-hex-digest')
var badRequest = require('./responses/bad-request')
var getForm = require('./get-form')
var internalError = require('./responses/internal-error')
var methodNotAllowed = require('./responses/method-not-allowed')
var normalize = require('commonform-normalize')

var PREFIX = 'form-has-annotation'

module.exports = function(request, response) {
  if (request.method === 'GET') {
    allowAuthorization(getAnnotations).apply(this, arguments) }
  else { methodNotAllowed(response) } }

function getAnnotations(request, response, parameters, log, level) {
  var query = url.parse(request.url, true).query
  var hasContext = ( ( 'context' in query ) && isDigest(query.context) )
  var hasForm = ( ( 'form' in query ) && isDigest(query.form) )
  if (!hasContext) { badRequest(response, 'Must specify context') }
  else {
    getForm(level, query.context, function(error, context) {
      context = JSON.parse(context).form
      if (error) {
        /* istanbul ignore else */
        if (error.notFound) { badRequest(response, 'Unknown form') }
        else { internalError(response, error) } }
      else {
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
      { gt: encode([ PREFIX, digest, null ]),
        lt: encode([ PREFIX, digest, undefined ]) }) } }

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
