var http = require('http')

module.exports = function(port, publisher, password, test, uuidFunction) {
  return function(callback) {
    http.request(
      { method: 'POST',
        port: port,
        path:
          ( '/annotations/' + uuidFunction() +
            '/subscribers/' + publisher ),
        auth: ( publisher + ':' + password ) })
      .on('response', function(response) {
        test.equal(response.statusCode, 204, '204')
        if (callback) { callback() } })
      .end() } }
