var http = require('http')

module.exports = function(port, publisher, password, test, digest) {
  return function(callback) {
    http.request(
      { method: 'DELETE',
        port: port,
        path: ( '/forms/' + digest + '/subscribers/' + publisher ),
        auth: ( publisher + ':' + password ) })
      .on('response', function(response) {
        test.equal(response.statusCode, 204, '204')
        if (callback) { callback() } })
      .end() } }
