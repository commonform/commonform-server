var http = require('http')

module.exports = function(port, subscriber, password, test, publisher, project) {
  return function(callback) {
    http.request(
      { method: 'DELETE',
        port: port,
        path:
          ( '/publishers/' + publisher +
            '/projects/' + project +
            '/subscribers/' + subscriber ),
        auth: ( subscriber + ':' + password ) })
      .on('response', function(response) {
        test.equal(response.statusCode, 204, '204')
        if (callback) { callback() } })
      .end() } }
