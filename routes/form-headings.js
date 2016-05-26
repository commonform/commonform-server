var decode = require('bytewise/encoding/hex').decode
var encode = require('bytewise/encoding/hex').encode
var internalError = require('./responses/internal-error')
var methodNotAllowed = require('./responses/method-not-allowed')
var sendJSON = require('./responses/send-json')

var PREFIX = 'form-under-heading-in-form'

module.exports = function(request, response, parameters, log, level) {
  if (request.method === 'GET') {
    var digest = parameters.digest
    var parents = [ ]
    level.createReadStream(
      { gt: encode([ PREFIX, digest, null ]),
        lt: encode([ PREFIX, digest, undefined ]) })
      .on('data', function(item) {
        var decoded = decode(item.key)
        parents.push({ heading: decoded[2], parent: decoded[3] }) })
      .on('error', function(error) { internalError(error) })
      .on('end', function() { sendJSON(response, parents) }) }
  else { methodNotAllowed(response) } }
