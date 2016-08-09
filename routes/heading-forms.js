var decode = require('../keys/decode')
var encode = require('../keys/encode')
var internalError = require('./responses/internal-error')
var methodNotAllowed = require('./responses/method-not-allowed')
var parseQuery = require('../parse-query-parameters')
var sendJSON = require('./responses/send-json')

var PREFIX = 'heading-for-form-in-form'

module.exports = function (request, response, parameters, log, level) {
  if (request.method === 'GET') {
    var heading = decodeURIComponent(parameters.heading).toLowerCase()
    var parents = []
    var query = parseQuery(request.query)
    var skip = query.skip
    level.createReadStream({
      gt: encode([PREFIX, heading, '']),
      lt: encode([PREFIX, heading, '~']),
      limit: query.limit
    })
    .on('data', function (item) {
      if (skip !== 0) {
        skip--
      } else {
        var decoded = decode(item.key)
        parents.push({
          digest: decoded[2],
          parent: decoded[3]
        })
      }
    })
    .once('error', /* istanbul ignore next */ function (error) {
      internalError(response, error)
    })
    .once('end', function () {
      sendJSON(response, parents)
    })
  } else {
    methodNotAllowed(response)
  }
}
