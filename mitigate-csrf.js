var forbidden = require('./routes/responses/forbidden')

var DOMAIN = process.env.DOMAIN || false

module.exports = function (request, response, callback) {
  /* istanbul ignore if */
  if (DOMAIN) {
    var URI = 'https://' + DOMAIN
    var origin = request.headers.origin
    var invalidOrigin = origin && origin !== URI
    if (invalidOrigin) {
      forbidden(response)
    } else {
      var referer = request.headers.referer
      var invalidReferer = referer && referer.indexOf(URI + '/') !== 0
      if (invalidReferer) {
        forbidden(response)
      } else {
        var webRequestWithoutCustomHeader = (
          (origin || referer) &&
          !request.headers['x-requested-with']
        )
        if (webRequestWithoutCustomHeader) {
          forbidden(response)
        } else {
          callback()
        }
      }
    }
  } else {
    callback()
  }
}
