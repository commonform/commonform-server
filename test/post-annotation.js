
var http = require('http')

module.exports = function(publisher, password, port, annotation, test) {
  return function(callback) {
    http.request(
      { method: 'POST',
        path: ( '/publishers/' + publisher + '/annotations' ),
        port: port,
        auth: ( publisher + ':' + password ) })
      .on('response', function(response) {
        response.pipe(process.stdout)
        test.equal(response.statusCode, 201, 'POST annotation')
        if (callback) { callback(null, response.headers.location) } })
      .end(JSON.stringify(annotation)) } }
