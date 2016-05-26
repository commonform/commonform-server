var decode = require('bytewise/encoding/hex').decode
var encode = require('bytewise/encoding/hex').encode
var internalError = require('./responses/internal-error')
var methodNotAllowed = require('./responses/method-not-allowed')
var sendJSON = require('./responses/send-json')

var PREFIX = 'term-used-in-form'

module.exports = function(request, response, parameters, log, level) {
  if (request.method === 'GET') {
    var term = parameters.term
    var digests = [ ]
    level.createReadStream(
      { gt: encode([ PREFIX, term, null ]),
        lt: encode([ PREFIX, term, undefined ]) })
      .on('data', function(item) { digests.push(decode(item.key)[2]) })
      .on('error', function(error) { internalError(response, error) })
      .on('end', function() { sendJSON(response, digests) }) }
  else { methodNotAllowed(response) } }
