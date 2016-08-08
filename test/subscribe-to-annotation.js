var http = require('http')

module.exports = function (
  port, publisher, password, test, uuidFunction
) {
  return function (callback) {
    var options = {
      method: 'POST',
      port: port,
      path: (
        '/annotations/' + uuidFunction() +
        '/subscribers/' + publisher
      ),
      auth: publisher + ':' + password
    }
    http.request(options, function (response) {
      test.equal(response.statusCode, 204, '204')
      if (callback) {
        callback()
      }
    })
    .end()
  }
}
