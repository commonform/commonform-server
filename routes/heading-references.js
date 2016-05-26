var decode = require('bytewise/encoding/hex').decode
var encode = require('bytewise/encoding/hex').encode
var internalError = require('./responses/internal-error')
var methodNotAllowed = require('./responses/method-not-allowed')
var sendJSON = require('./responses/send-json')

var PREFIX = 'heading-referenced-in-form'

module.exports = function(request, response, parameters, log, level) {
  if (request.method === 'GET') {
    var heading = parameters.heading
    var digests = [ ]
    level.createReadStream(
      { gt: encode([ PREFIX, heading, null ]),
        lt: encode([ PREFIX, heading, undefined ]) })
      .on('data', function(item) {
        digests.push(decode(item.key)[2]) })
      .on('error', function(error) { internalError(error) })
      .on('end', function() { sendJSON(response, digests) }) }
  else { methodNotAllowed(response) } }
