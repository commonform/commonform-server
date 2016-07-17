var http = require('http')

module.exports =
  function (publisher, password, port, project, edition, digest, test) {
    return function (callback) {
      var options = {
        auth: publisher + ':' + password,
        method: 'POST',
        port: port,
        path: (
          '/publishers/' + publisher +
          '/projects/' + project +
          '/publications/' + edition
        )
      }
      http.request(options, function (response) {
        test.equal(
          response.statusCode, 204,
          'POST ' + publisher + ':' + project + '@' + edition
        )
        if (callback) callback()
      }).end(JSON.stringify({digest: digest}))
    }
  }
