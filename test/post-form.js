var http = require('http')

module.exports = function(port, form, test) {
  return function(callback) {
    http.request({ method: 'POST', path: '/forms', port: port })
      .on('response', function(response) {
        test.equal(response.statusCode, 201, 'POST form')
        if (callback) { callback() } })
      .end(JSON.stringify(form)) } }
