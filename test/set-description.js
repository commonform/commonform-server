var http = require('http')

module.exports = function (
  publisher, password, port,
  project, description,
  test
) {
  return function (callback) {
    var options = {
      auth: publisher + ':' + password,
      method: 'PUT',
      port: port,
      path: (
        '/publishers/' + publisher +
        '/projects/' + project +
        '/description'
      )
    }
    http.request(options, function (response) {
      test.equal(
        response.statusCode, 204,
        'PUT ' + publisher + ':' + project + ' description'
      )
      if (callback) {
        callback()
      }
    })
      .end(JSON.stringify(description))
  }
}
