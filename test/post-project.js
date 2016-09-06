var http = require('http')

module.exports = function (
  publisher, password, port,
  project, edition,
  digest, directions, signaturePages,
  test
) {
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
    var body = {
      digest: digest
    }
    if (signaturePages) {
      body.signaturePages = signaturePages
    }
    if (directions) {
      body.directions = directions
    }
    http.request(options, function (response) {
      test.equal(
        response.statusCode, 204,
        'POST ' + publisher + ':' + project + '@' + edition
      )
      if (callback) {
        callback()
      }
    })
    .end(JSON.stringify(body))
  }
}
