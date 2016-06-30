var http = require('http')

module.exports = function (port, form, test) {
  return function (callback) {
    var options = {method: 'POST', path: '/forms', port: port}
    http.request(options, function (response) {
      test.equal(response.statusCode, 201, 'POST form')
      if (callback) callback()
    }).end(JSON.stringify(form))
  }
}
