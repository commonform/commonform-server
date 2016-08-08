var http = require('http')

module.exports = function (port, publisher, password, test, digest) {
  return function (callback) {
    var options = {
      method: 'DELETE',
      port: port,
      path: '/forms/' + digest + '/subscribers/' + publisher,
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
