var encode = require('../keys/encode')
var url = require('url')
var isDigest = require('is-sha-256-hex-digest')
var methodNotAllowed = require('./responses/method-not-allowed')

var PREFIX = 'form-has-annotation'

module.exports = function(request, response, parameters, log, level) {
  if (request.method === 'GET') {
    var query = url.parse(request.url, true).query
    var matchesContext = (
      ( ( 'context' in query ) &&
        isDigest(query.context) )
        ? function(x) { return ( x.context === query.context ) }
        : function() { return true } )
    var digest = parameters.digest
    var first = true
    response.write('[\n')
    level.createReadStream(
      { gt: encode([ PREFIX, digest, null ]),
        lt: encode([ PREFIX, digest, undefined ]) })
      .on('data', function(item) {
        var annotation = JSON.parse(item.value)
        if (matchesContext(annotation)) {
          response.write(( ( first ? '' : ',' ) + item.value + '\n' ))
          first = false } })
      .on('error',
        /* istanbul ignore next */
        function(error) {
          log.error(error)
          response.end('\n]') })
      .on('end', function() { response.end('\n]') }) }
  else { methodNotAllowed(response) } }
