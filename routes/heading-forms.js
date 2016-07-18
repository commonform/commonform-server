var decode = require('../keys/decode')
var encode = require('../keys/encode')
var internalError = require('./responses/internal-error')
var methodNotAllowed = require('./responses/method-not-allowed')
var sendJSON = require('./responses/send-json')

var PREFIX = 'heading-for-form-in-form'

module.exports = function (request, response, parameters, log, level) {
  if (request.method === 'GET') {
    var heading = decodeURIComponent(parameters.heading)
    var parents = []
    level.createReadStream({
      gt: encode([PREFIX, heading, '']),
      lt: encode([PREFIX, heading, '~'])
    })
    .on('data', function (item) {
      var decoded = decode(item.key)
      parents.push({
        digest: decoded[2],
        parent: decoded[3]
      })
    })
    .once('error', /* istanbul ignore next */ function (error) {
      internalError(error)
    })
    .once('end', function () {
      sendJSON(response, parents)
    })
  } else methodNotAllowed(response)
}
