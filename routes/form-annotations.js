var encode = require('../keys/encode')
var methodNotAllowed = require('./responses/method-not-allowed')

var PREFIX = 'form-has-annotation'

module.exports = function(request, response, parameters, log, level) {
  if (request.method === 'GET') {
    var digest = parameters.digest
    var first = true
    response.write('[\n')
    level.createReadStream(
      { gt: encode([ PREFIX, digest, null ]),
        lt: encode([ PREFIX, digest, undefined ]) })
      .on('data', function(item) {
        response.write(( ( first ? '' : ',' ) + item.value + '\n' ))
        first = false })
      .on('error',
        /* istanbul ignore next */
        function(error) {
          log.error(error)
          response.end('\n]') })
      .on('end', function() { response.end('\n]') }) }
  else { methodNotAllowed(response) } }
