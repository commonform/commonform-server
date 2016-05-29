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
  var hasDisplaying = ( ( 'displaying' in query ) && isDigest(query.displaying) )
  if (!hasDisplaying) { badRequest(response, 'Must specify displaying') }
  else {
    getForm(level, query.displaying, function(error, displaying) {
      displaying = JSON.parse(displaying).form
      if (error) {
        if (error.notFound) { badRequest(response, 'Unknown form') }
        else { internalError(response, error) } }
      else {
        var contexts = computeContexts(normalize(displaying))
        var streams = Object.keys(contexts).map(function(digest) {
          return function() {
            return level.createReadStream(
              { gt: encode([ PREFIX, digest, null ]),
                lt: encode([ PREFIX, digest, undefined ]) }) } })
        var first = true
        response.write('[\n')
        multistream.obj(streams)
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
          .on('end', function() { response.end('\n]') }) } }) } }

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
