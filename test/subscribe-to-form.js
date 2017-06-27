var http = require('http')

module.exports = function (port, subscriber, password, test, digest) {
  return function (callback) {
    var options = {
      method: 'POST',
      port: port,
      path: '/forms/' + digest + '/subscribers/' + subscriber,
      auth: subscriber + ':' + password
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
