var http = require('http')

module.exports = function(port, subscriber, password, test, publisher, project, edition) {
  return function(callback) {
    http.request(
      { method: 'POST',
        port: port,
        path:
          ( '/publishers/' + publisher +
            '/projects/' + project +
            '/publications/' + edition +
            '/subscribers/' + subscriber ),
        auth: ( subscriber + ':' + password ) })
      .on('response', function(response) {
        test.equal(response.statusCode, 204, '204')
        if (callback) { callback() } })
      .end() } }
