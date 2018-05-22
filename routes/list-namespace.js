var decode = require('../keys/decode')
var encode = require('../keys/encode')
var methodNotAllowed = require('./responses/method-not-allowed')
var parseQuery = require('../parse-query-parameters')

module.exports = function (namespace) {
  return function (request, response, parameters, log, level) {
    if (request.method === 'GET') {
      var first = true
      var prefix = request.query.prefix
        ? request.query.prefix.toLowerCase()
        : ''
      var query = parseQuery(request.query)
      var skip = query.skip
      response.setHeader('Content-Type', 'application/json')
      response.write('[\n')
      level.createReadStream({
        gt: encode([namespace, prefix + '']),
        lt: encode([namespace, prefix + '~']),
        limit: query.limit
      })
        .on('data', function (item) {
          if (skip !== 0) {
            skip--
          } else {
            response.write(
              (first ? '' : ',') +
              JSON.stringify(decode(item.key)[1]) + '\n'
            )
            first = false
          }
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
