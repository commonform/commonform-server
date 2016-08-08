var http = require('http')

module.exports = function (
  publisher, password, port, annotation, test
) {
  return function (callback) {
    var options = {
      method: 'POST',
      path: '/annotations',
      port: port,
      auth: publisher + ':' + password
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 204, 'POST annotation')
      if (callback) {
        callback(null, response.headers.location)
      }
    })
    .end(JSON.stringify(annotation))
  }
}
