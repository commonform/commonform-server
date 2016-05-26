var encode = require('bytewise/encoding/hex').encode
var decode = require('bytewise/encoding/hex').decode
var methodNotAllowed = require('./responses/method-not-allowed')

module.exports = function(namespace) {
  return function(request, response, parameters, log, level ) {
    if (request.method === 'GET') {
      var first = true
      response.setHeader('Content-Type', 'application/json')
      response.write('[\n')
      level.createReadStream(
        { gt: encode([ namespace, null ]),
          lt: encode([ namespace, undefined ]) })
        .on('data', function(item) {
          response.write(
            ( ( first ? '' : ',' ) +
              JSON.stringify(decode(item.key)[1]) ))
          first = false })
        .on('error', function(error) {
          log.error(error)
          response.end(']') })
        .on('end', function() { response.end(']') }) }
    else { methodNotAllowed(response) } } }
