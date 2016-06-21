var http = require('http')

module.exports = function(publisher, password, port, form, test) {
  return function(callback) {
    http.request(
      { method: 'POST',
        path: '/forms',
        auth: ( publisher + ':' + password ),
        port: port })
      .on('response', function(response) {
        test.equal(response.statusCode, 201, 'POST form')
        if (callback) { callback() } })
      .end(JSON.stringify(form)) } }
