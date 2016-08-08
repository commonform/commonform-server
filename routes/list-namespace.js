var decode = require('../keys/decode')
var encode = require('../keys/encode')
var methodNotAllowed = require('./responses/method-not-allowed')

module.exports = function (namespace) {
  return function (request, response, parameters, log, level) {
    if (request.method === 'GET') {
      var first = true
      response.setHeader('Content-Type', 'application/json')
      response.write('[\n')
      level.createReadStream({
        gt: encode([namespace, '']),
        lt: encode([namespace, '~'])
      })
      .on('data', function (item) {
        response.write(
          (first ? '' : ',') +
          JSON.stringify(decode(item.key)[1]) + '\n'
        )
        first = false
      })
      .once('error', /* istanbul ignore next */ function (error) {
        log.error(error)
        response.end(']')
      })
      .once('end', function () {
        response.end(']')
      })
    } else {
      methodNotAllowed(response)
    }
  }
}
